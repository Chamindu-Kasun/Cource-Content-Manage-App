'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { Topic, Unit } from '@/types';
import Link from 'next/link';

type TopicFormData = {
  unit_id: string;
  topic_title: string;
  topic_order: number;
  description: string;
};

export default function CreateTopicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopicFormData>();

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const q = query(collection(db, 'units'), orderBy('unit_number', 'asc'));
      const querySnapshot = await getDocs(q);
      const unitsData: Unit[] = [];
      querySnapshot.forEach((doc) => {
        unitsData.push({ id: doc.id, ...doc.data() } as Unit);
      });
      setUnits(unitsData);
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoadingUnits(false);
    }
  };

  const onSubmit = async (data: TopicFormData) => {
    setLoading(true);
    try {
      const topicData: Omit<Topic, 'id'> = {
        ...data,
        topic_order: Number(data.topic_order),
        created_at: new Date(),
        updated_at: new Date(),
      };

      await addDoc(collection(db, 'topics'), topicData);
      router.push('/admin/topics');
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  if (loadingUnits) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/topics"
            className="text-gray-400 hover:text-gray-500"
          >
            ← Back to Topics
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-6 text-gray-900">Create New Topic</h1>
        <p className="mt-2 text-sm text-gray-700">
          Add a new topic to a course unit
        </p>
      </div>

      {units.length === 0 ? (
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-800">
            <h3 className="font-medium">No units available</h3>
            <p className="mt-1 text-sm">You need to create at least one unit before adding topics.</p>
            <div className="mt-4">
              <Link
                href="/admin/units/create"
                className="inline-flex items-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700"
              >
                Create Unit First
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Topic Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Basic information about the course topic.
                </p>
              </div>
              <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">
                <div>
                  <label htmlFor="unit_id" className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('unit_id', { required: 'Please select a unit' })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select a unit...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          Unit {unit.unit_number}: {unit.unit_title}
                        </option>
                      ))}
                    </select>
                    {errors.unit_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.unit_id.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="topic_order" className="block text-sm font-medium text-gray-700">
                    Topic Order
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      {...register('topic_order', {
                        required: 'Topic order is required',
                        min: { value: 1, message: 'Topic order must be positive' },
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="1"
                    />
                    {errors.topic_order && (
                      <p className="mt-2 text-sm text-red-600">{errors.topic_order.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="topic_title" className="block text-sm font-medium text-gray-700">
                    Topic Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      {...register('topic_title', {
                        required: 'Topic title is required',
                        minLength: { value: 3, message: 'Title must be at least 3 characters' },
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Database Fundamentals"
                    />
                    {errors.topic_title && (
                      <p className="mt-2 text-sm text-red-600">{errors.topic_title.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={4}
                      {...register('description', {
                        required: 'Description is required',
                        minLength: { value: 10, message: 'Description must be at least 10 characters' },
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Brief description of what this topic covers..."
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/topics"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Topic'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}