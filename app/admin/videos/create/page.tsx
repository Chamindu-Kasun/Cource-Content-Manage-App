'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { Video, Topic, Unit } from '@/types';
import Link from 'next/link';

type VideoFormData = {
  topic_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  thumbnail_url: string;
  order_index: number;
};

function CreateVideoContent() {
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
    watch,
  } = useForm<VideoFormData>();

  const watchedTopicId = watch('topic_id');

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

  const onSubmit = async (data: VideoFormData) => {
    setLoading(true);
    try {
      const videoData: Omit<Video, 'id'> = {
        ...data,
        duration: Number(data.duration),
        order_index: Number(data.order_index),
        created_at: new Date(),
      };

      await addDoc(collection(db, 'videos'), videoData);
      router.push('/admin/videos');
    } catch (error) {
      console.error('Error creating video:', error);
      alert('Failed to create video');
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/videos"
            className="text-gray-400 hover:text-gray-500"
          >
            ← Back to Videos
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-6 text-gray-900">Upload New Video</h1>
        <p className="mt-2 text-sm text-gray-700">
          Add a new video to a course topic
        </p>
        {preSelectedUnit && preSelectedTopic && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              📚 Adding video to: <strong>{units.find(u => u.id === preSelectedUnit)?.unit_title}</strong> → 
              📖 <strong>{topics.find(t => t.id === preSelectedTopic)?.topic_title}</strong>
            </p>
          </div>
        )}
      </div>

      {topics.length === 0 ? (
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-800">
            <h3 className="font-medium">No topics available</h3>
            <p className="mt-1 text-sm">You need to create at least one topic before adding videos.</p>
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
                <h3 className="text-lg font-medium leading-6 text-gray-900">Video Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Basic details about the video content.
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
                    Video Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      {...register('title', {
                        required: 'Video title is required',
                        minLength: { value: 3, message: 'Title must be at least 3 characters' },
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Introduction to SQL"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
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
                      placeholder="Brief description of the video content..."
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration (seconds)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        {...register('duration', {
                          required: 'Duration is required',
                          min: { value: 1, message: 'Duration must be positive' },
                        })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="300"
                      />
                      {errors.duration && (
                        <p className="mt-2 text-sm text-red-600">{errors.duration.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="order_index" className="block text-sm font-medium text-gray-700">
                      Order Index
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        {...register('order_index', {
                          required: 'Order index is required',
                          min: { value: 1, message: 'Order index must be positive' },
                        })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="1"
                      />
                      {errors.order_index && (
                        <p className="mt-2 text-sm text-red-600">{errors.order_index.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Media URLs</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Links to the video file and thumbnail image.
                </p>
              </div>
              <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">
                <div>
                  <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">
                    Video URL
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      {...register('video_url', {
                        required: 'Video URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please enter a valid URL'
                        }
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="https://example.com/video.mp4"
                    />
                    {errors.video_url && (
                      <p className="mt-2 text-sm text-red-600">{errors.video_url.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">
                    Thumbnail URL
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      {...register('thumbnail_url', {
                        required: 'Thumbnail URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please enter a valid URL'
                        }
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                    {errors.thumbnail_url && (
                      <p className="mt-2 text-sm text-red-600">{errors.thumbnail_url.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/videos"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CreateVideoContent />
    </Suspense>
  );
}