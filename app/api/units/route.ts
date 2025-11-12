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
    const units = unitsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        unit_number: data.unit_number.toString(),
        unit_title: data.unit_title,
        _sort_key: data.unit_number || 0
      };
    }).sort((a, b) => a._sort_key - b._sort_key)
    .map(({ _sort_key, ...unit }) => unit); // Remove sort key from final result

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

    const topics = [];

    for (const topicDoc of topicsArray) {
      const topicData = topicDoc.data;
      const topicId = topicDoc.id;
      
      // Get all content for this topic
      const [videosSnapshot, notesSnapshot, questionsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'videos'), 
          where('topic_id', '==', topicId)
        )),
        getDocs(query(
          collection(db, 'notes'), 
          where('topic_id', '==', topicId)
        )),
        getDocs(query(
          collection(db, 'questions'), 
          where('topic_id', '==', topicId)
        ))
      ]);

      // Format content arrays and sort manually
      const videos = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        video_url: doc.data().video_url,
        duration: doc.data().duration,
        order_index: doc.data().order_index || 0
      })).sort((a, b) => a.order_index - b.order_index);

      const notes = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        content: doc.data().content,
        note_type: doc.data().note_type
      }));

      const questions = questionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          question_text: data.question_text,
          question_type: data.question_type,
          difficulty_level: data.difficulty_level,
          options: data.options || null,
          correct_answer: data.correct_answer,
          explanation: data.explanation
        };
      });

      // Build topic object in your requested format
      const topicContent = `${topicData.topic_title}`;
      
      topics.push({
        topic_content: topicContent,
        questions: questions,
        notes: notes,
        videos: videos
      });
    }

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