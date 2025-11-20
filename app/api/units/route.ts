import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitParam = searchParams.get('unit');

    if (unitParam) {
      // Return specific unit content
      const unitNumber = parseInt(unitParam);
      const unitData = await getUnitWithContent(unitNumber);
      if (!unitData) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
      }
      return NextResponse.json(unitData);
    }

    // Get all units - just basic info for mapping (no orderBy to avoid index issues)
    const unitsQuery = collection(db, 'units');
    const unitsSnapshot = await getDocs(unitsQuery);
    
    // Sort manually by unit_number
    const units = unitsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          unit_number: data.unit_number.toString(),
          unit_title: data.unit_title,
          sortKey: data.unit_number || 0
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ sortKey, ...unit }) => unit); // Remove sort key from final result

    return NextResponse.json({ units });

  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function getUnitWithContent(unitNumber: number) {
  try {
    // Get the specific unit
    const unitsQuery = query(
      collection(db, 'units'), 
      where('unit_number', '==', unitNumber.toString())
    );
    const unitsSnapshot = await getDocs(unitsQuery);
    
    if (unitsSnapshot.empty) {
      return null;
    }

    const unitDoc = unitsSnapshot.docs[0];
    const unitData = unitDoc.data();
    const unitId = unitDoc.id;

    // Get topics for this unit
    const topicsQuery = query(
      collection(db, 'topics'), 
      where('unit_id', '==', unitId)
    );
    const topicsSnapshot = await getDocs(topicsQuery);

    // Convert to array and sort manually by topic_order
    const topicsArray = topicsSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    })).sort((a, b) => (a.data.topic_order || 0) - (b.data.topic_order || 0));

    // Extract all topic IDs for batch querying
    const topicIds = topicsArray.map(topic => topic.id);

    // If no topics, return empty
    if (topicIds.length === 0) {
      return {
        unit_number: unitData.unit_number,
        unit_title: unitData.unit_title,
        topics: []
      };
    }

    // Batch fetch all content for all topics in parallel using 'in' operator
    // Firestore 'in' queries support up to 10 values, so we need to batch if more than 10 topics
    const batchSize = 10;
    const topicIdBatches: string[][] = [];
    for (let i = 0; i < topicIds.length; i += batchSize) {
      topicIdBatches.push(topicIds.slice(i, i + batchSize));
    }

    // Fetch content for all batches in parallel
    const contentPromises = topicIdBatches.flatMap(batch => [
      getDocs(query(collection(db, 'videos'), where('topic_id', 'in', batch))),
      getDocs(query(collection(db, 'notes'), where('topic_id', 'in', batch))),
      getDocs(query(collection(db, 'questions'), where('topic_id', 'in', batch)))
    ]);

    const contentSnapshots = await Promise.all(contentPromises);

    // Define types for content items
    type VideoContent = {
      id: string;
      title: string;
      description: string;
      video_url: string;
      duration: number;
      order_index: number;
    };

    type NoteContent = {
      id: string;
      title: string;
      content: string;
      note_type: string;
    };

    type QuestionContent = {
      id: string;
      question_text: string;
      question_type: string;
      difficulty_level: string;
      options: { text: string; is_correct: boolean }[] | null;
      correct_answer: string;
      explanation: string;
    };

    // Group content by topic_id for efficient lookup
    const videosByTopic = new Map<string, VideoContent[]>();
    const notesByTopic = new Map<string, NoteContent[]>();
    const questionsByTopic = new Map<string, QuestionContent[]>();

    // Process snapshots in groups of 3 (videos, notes, questions for each batch)
    for (let i = 0; i < contentSnapshots.length; i += 3) {
      const videosSnapshot = contentSnapshots[i];
      const notesSnapshot = contentSnapshots[i + 1];
      const questionsSnapshot = contentSnapshots[i + 2];

      videosSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const topicId = data.topic_id;
        if (!videosByTopic.has(topicId)) {
          videosByTopic.set(topicId, []);
        }
        videosByTopic.get(topicId)!.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          video_url: data.video_url,
          duration: data.duration,
          order_index: data.order_index || 0
        });
      });

      notesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const topicId = data.topic_id;
        if (!notesByTopic.has(topicId)) {
          notesByTopic.set(topicId, []);
        }
        notesByTopic.get(topicId)!.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          note_type: data.note_type
        });
      });

      questionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const topicId = data.topic_id;
        if (!questionsByTopic.has(topicId)) {
          questionsByTopic.set(topicId, []);
        }
        questionsByTopic.get(topicId)!.push({
          id: doc.id,
          question_text: data.question_text,
          question_type: data.question_type,
          difficulty_level: data.difficulty_level,
          options: data.options || null,
          correct_answer: data.correct_answer,
          explanation: data.explanation
        });
      });
    }

    // Build topics array with content
    const topics = topicsArray.map(topicDoc => {
      const topicData = topicDoc.data;
      const topicId = topicDoc.id;

      // Get content for this topic and sort videos by order_index
      const videos = (videosByTopic.get(topicId) || []).sort((a, b) => a.order_index - b.order_index);
      const notes = notesByTopic.get(topicId) || [];
      const questions = questionsByTopic.get(topicId) || [];

      // Build topic object in requested format
      const topicContent = `${topicData.topic_title}`;
      
      return {
        topic_content: topicContent,
        questions: questions,
        notes: notes,
        videos: videos
      };
    });

    return {
      unit_number: unitData.unit_number,
      unit_title: unitData.unit_title,
      topics: topics
    };

  } catch (error) {
    console.error('Error fetching unit content:', error);
    return null;
  }
}