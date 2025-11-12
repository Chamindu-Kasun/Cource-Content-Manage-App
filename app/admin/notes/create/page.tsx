'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { Note, Topic, Unit } from '@/types';
import Link from 'next/link';

type NoteFormData = {
  topic_id: string;
  title: string;
  content: string;
};

function CreateNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<(Topic & { unit_title?: string })[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  
  // Get pre-selected unit and topic from URL params
  const preSelectedUnit = searchParams.get('unit') || '';
  const preSelectedTopic = searchParams.get('topic') || '';
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<NoteFormData>();

  // Filter topics by selected unit
  const filteredTopics = selectedUnit 
    ? topics.filter(topic => topic.unit_id === selectedUnit)
    : topics;

  useEffect(() => {
    loadData();
  }, []);

  // Set pre-selected values when data loads
  useEffect(() => {
    if (units.length > 0 && topics.length > 0) {
      if (preSelectedUnit) {
        setSelectedUnit(preSelectedUnit);
      }
      if (preSelectedTopic) {
        setValue('topic_id', preSelectedTopic);
      }
    }
  }, [units, topics, preSelectedUnit, preSelectedTopic, setValue]);

  const loadData = async () => {
    try {
      const [topicsSnap, unitsSnap] = await Promise.all([
        getDocs(query(collection(db, 'topics'), orderBy('topic_order', 'asc'))),
        getDocs(query(collection(db, 'units'), orderBy('unit_number', 'asc')))
      ]);

      const unitsData: Unit[] = [];
      unitsSnap.forEach((doc) => {
        unitsData.push({ id: doc.id, ...doc.data() } as Unit);
      });
      setUnits(unitsData);

      const topicsData: (Topic & { unit_title?: string })[] = [];
      topicsSnap.forEach((doc) => {
        const topic = { id: doc.id, ...doc.data() } as Topic;
        const unit = unitsData.find(u => u.id === topic.unit_id);
        topicsData.push({
          ...topic,
          unit_title: unit?.unit_title || 'Unknown Unit'
        });
      });
      setTopics(topicsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: NoteFormData) => {
    setLoading(true);
    try {
      const noteData: Omit<Note, 'id'> = {
        ...data,
        images: [],
        attachments: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      await addDoc(collection(db, 'notes'), noteData);
      router.push('/admin/notes');
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/notes"
            className="text-gray-400 hover:text-gray-500"
          >
            ← Back to Notes
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-6 text-gray-900">Create Study Note</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create comprehensive study notes for a course topic
        </p>
        {preSelectedUnit && preSelectedTopic && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📚 Creating note for: <strong>{units.find(u => u.id === preSelectedUnit)?.unit_title}</strong> → 
              📖 <strong>{topics.find(t => t.id === preSelectedTopic)?.topic_title}</strong>
            </p>
          </div>
        )}
      </div>

      {topics.length === 0 ? (
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-800">
            <h3 className="font-medium">No topics available</h3>
            <p className="mt-1 text-sm">You need to create at least one topic before adding notes.</p>
            <div className="mt-4">
              <Link
                href="/admin/topics/create"
                className="inline-flex items-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700"
              >
                Create Topic First
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Note Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Basic details about the study note.
                </p>
              </div>
              <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">
                {/* Unit Selection */}
                <div>
                  <label htmlFor="unit_selection" className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <div className="mt-1">
                    <select
                      value={selectedUnit}
                      onChange={(e) => {
                        setSelectedUnit(e.target.value);
                        setValue('topic_id', ''); // Reset topic when unit changes
                      }}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select a unit...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          Unit {unit.unit_number}: {unit.unit_title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Topic Selection */}
                <div>
                  <label htmlFor="topic_id" className="block text-sm font-medium text-gray-700">
                    Topic
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('topic_id', { required: 'Please select a topic' })}
                      disabled={!selectedUnit}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {selectedUnit ? 'Select a topic...' : 'Select a unit first'}
                      </option>
                      {filteredTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.topic_title}
                        </option>
                      ))}
                    </select>
                    {errors.topic_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.topic_id.message}</p>
                    )}
                  </div>
                  {!selectedUnit && (
                    <p className="mt-1 text-sm text-gray-500">
                      Please select a unit first to see available topics.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Note Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      {...register('title', {
                        required: 'Note title is required',
                        minLength: { value: 3, message: 'Title must be at least 3 characters' },
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Introduction to SQL Queries"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Note Content</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The main content of your study note. You can include detailed explanations, examples, and key points.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={15}
                      {...register('content', {
                        required: 'Content is required',
                        minLength: { value: 50, message: 'Content must be at least 50 characters' },
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
                      placeholder="Write your study notes here...

You can include:
- Key concepts and definitions
- Examples and code snippets
- Important formulas or syntax
- Visual explanations
- Practice problems and solutions

Use clear formatting and organize your content in a logical flow."
                    />
                    {errors.content && (
                      <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Tip: Use clear headings, bullet points, and examples to make your notes easy to follow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/notes"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function CreateNotePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CreateNoteContent />
    </Suspense>
  );
}