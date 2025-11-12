'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Topic, Unit } from '@/types';
import Link from 'next/link';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TopicsPage() {
  const [topics, setTopics] = useState<(Topic & { unit_title?: string })[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTopics();
  }, [selectedUnit]);

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
      setLoading(false);
    }
  };

  const filterTopics = () => {
    // This will be handled by the display logic since we load all topics
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This will also delete all associated videos, notes, and questions.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'topics', topicId));
      await loadData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
    }
  };

  const filteredTopics = selectedUnit === 'all' 
    ? topics 
    : topics.filter(topic => topic.unit_id === selectedUnit);

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
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Topics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage topics for course units
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/topics/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Topic
          </Link>
        </div>
      </div>

      {/* Filter by Unit */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="unit-filter" className="text-sm font-medium text-gray-700">
            Filter by Unit:
          </label>
          <select
            id="unit-filter"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Units</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unit {unit.unit_number}: {unit.unit_title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">📖</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No topics</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedUnit === 'all' 
              ? 'Get started by creating a new topic.' 
              : 'No topics found for the selected unit.'}
          </p>
          <div className="mt-6">
            <Link
              href="/admin/topics/create"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Topic
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTopics.map((topic) => (
              <li key={topic.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">
                          {topic.topic_order}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {topic.topic_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {topic.unit_title} • {topic.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/topics/${topic.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <button
                      onClick={() => handleDeleteTopic(topic.id!)}
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