'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Note, Topic, Unit } from '@/types';
import Link from 'next/link';
import { TrashIcon, PencilIcon, PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

type NoteWithDetails = Note & {
  topic_title?: string;
  unit_title?: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteWithDetails[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  // Get topics filtered by selected unit
  const filteredTopics = selectedUnit 
    ? topics.filter(topic => topic.unit_id === selectedUnit)
    : [];

  useEffect(() => {
    loadData();
  }, []);

  // Reset topic selection when unit changes
  useEffect(() => {
    if (selectedUnit) {
      setSelectedTopic(''); // Reset topic when unit changes
    }
  }, [selectedUnit]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notesSnap, topicsSnap, unitsSnap] = await Promise.all([
        getDocs(collection(db, 'notes')),
        getDocs(query(collection(db, 'topics'), orderBy('topic_order', 'asc'))),
        getDocs(query(collection(db, 'units'), orderBy('unit_number', 'asc')))
      ]);

      const unitsData: Unit[] = [];
      unitsSnap.forEach((doc) => {
        unitsData.push({ id: doc.id, ...doc.data() } as Unit);
      });
      setUnits(unitsData);

      const topicsData: Topic[] = [];
      topicsSnap.forEach((doc) => {
        topicsData.push({ id: doc.id, ...doc.data() } as Topic);
      });
      setTopics(topicsData);

      const notesData: NoteWithDetails[] = [];
      notesSnap.forEach((doc) => {
        const note = { id: doc.id, ...doc.data() } as Note;
        const topic = topicsData.find(t => t.id === note.topic_id);
        const unit = unitsData.find(u => u.id === topic?.unit_id);
        
        notesData.push({
          ...note,
          topic_title: topic?.topic_title || 'Unknown Topic',
          unit_title: unit?.unit_title || 'Unknown Unit'
        });
      });
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      await loadData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const filteredNotes = selectedTopic 
    ? notes.filter(note => note.topic_id === selectedTopic)
    : selectedUnit 
    ? notes.filter(note => {
        const topic = topics.find(t => t.id === note.topic_id);
        return topic?.unit_id === selectedUnit;
      })
    : notes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Notes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage study notes organized by Unit → Topic structure
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/notes/create"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Browse All Notes
          </Link>
        </div>
      </div>

      {/* Hierarchical Filter by Unit → Topic */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Unit and Topic</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unit Selection */}
          <div>
            <label htmlFor="unit-filter" className="block text-sm font-medium text-gray-700 mb-2">
              📚 Step 1: Select Unit
            </label>
            <select
              id="unit-filter"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Choose a unit...</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.unit_number}: {unit.unit_title}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selection */}
          <div>
            <label htmlFor="topic-filter" className="block text-sm font-medium text-gray-700 mb-2">
              📖 Step 2: Select Topic
            </label>
            <select
              id="topic-filter"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedUnit}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedUnit ? 'Choose a topic...' : 'Select a unit first'}
              </option>
              {filteredTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.topic_title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Note Button - only show when topic is selected */}
        {selectedTopic && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-green-900">Ready to add study note</h4>
                <p className="text-sm text-green-700">
                  Selected: {units.find(u => u.id === selectedUnit)?.unit_title} → {filteredTopics.find(t => t.id === selectedTopic)?.topic_title}
                </p>
              </div>
              <Link
                href={`/admin/notes/create?unit=${selectedUnit}&topic=${selectedTopic}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Add Note to This Topic
              </Link>
            </div>
          </div>
        )}
        
        {selectedUnit && !selectedTopic && filteredTopics.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              No topics found for this unit. 
              <Link href="/admin/topics/create" className="font-medium underline ml-1">
                Create a topic first
              </Link>
            </p>
          </div>
        )}
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">📝</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {selectedTopic ? 'No notes for this topic' : selectedUnit ? 'No notes in this unit' : 'No notes'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTopic 
              ? 'Get started by creating a study note for this topic.' 
              : selectedUnit
              ? 'No notes found for the selected unit. Select a topic to add notes.'
              : 'Select a unit and topic above to add study notes.'}
          </p>
          {selectedTopic && (
            <div className="mt-6">
              <Link
                href={`/admin/notes/create?unit=${selectedUnit}&topic=${selectedTopic}`}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Create First Note
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredNotes.map((note) => (
              <li key={note.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-10 w-10 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {note.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {note.unit_title} - {note.topic_title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/notes/${note.id}`}
                      className="text-green-600 hover:text-green-900 text-sm"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/notes/${note.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <button
                      onClick={() => handleDeleteNote(note.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}