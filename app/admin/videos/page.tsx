'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Video, Topic, Unit } from '@/types';
import Link from 'next/link';
import { TrashIcon, PencilIcon, PlusIcon, PlayIcon } from '@heroicons/react/24/outline';

type VideoWithDetails = Video & {
  topic_title?: string;
  unit_title?: string;
};

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoWithDetails[]>([]);
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
      const [videosSnap, topicsSnap, unitsSnap] = await Promise.all([
        getDocs(query(collection(db, 'videos'), orderBy('order_index', 'asc'))),
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

      const videosData: VideoWithDetails[] = [];
      videosSnap.forEach((doc) => {
        const video = { id: doc.id, ...doc.data() } as Video;
        const topic = topicsData.find(t => t.id === video.topic_id);
        const unit = unitsData.find(u => u.id === topic?.unit_id);
        
        videosData.push({
          ...video,
          topic_title: topic?.topic_title || 'Unknown Topic',
          unit_title: unit?.unit_title || 'Unknown Unit'
        });
      });
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'videos', videoId));
      await loadData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredVideos = selectedTopic 
    ? videos.filter(video => video.topic_id === selectedTopic)
    : selectedUnit 
    ? videos.filter(video => {
        const topic = topics.find(t => t.id === video.topic_id);
        return topic?.unit_id === selectedUnit;
      })
    : videos;

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
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Videos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage video content organized by Unit → Topic structure
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/videos/create"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Browse All Content
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

        {/* Add Video Button - only show when topic is selected */}
        {selectedTopic && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-green-900">Ready to add video</h4>
                <p className="text-sm text-green-700">
                  Selected: {units.find(u => u.id === selectedUnit)?.unit_title} → {filteredTopics.find(t => t.id === selectedTopic)?.topic_title}
                </p>
              </div>
              <Link
                href={`/admin/videos/create?unit=${selectedUnit}&topic=${selectedTopic}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Add Video to This Topic
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

      {filteredVideos.length === 0 ? (
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">🎥</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {selectedTopic ? 'No videos for this topic' : selectedUnit ? 'No videos in this unit' : 'No videos'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTopic 
              ? 'Get started by adding a video to this topic.' 
              : selectedUnit
              ? 'No videos found for the selected unit. Select a topic to add videos.'
              : 'Select a unit and topic above to add videos.'}
          </p>
          {selectedTopic && (
            <div className="mt-6">
              <Link
                href={`/admin/videos/create?unit=${selectedUnit}&topic=${selectedTopic}`}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add First Video
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-100">
                    <PlayIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {video.description}
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <div>{video.unit_title}</div>
                  <div>{video.topic_title}</div>
                  <div>Order: {video.order_index}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-900 text-sm"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Watch
                  </a>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/videos/${video.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <button
                      onClick={() => handleDeleteVideo(video.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}