'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Unit, Topic, Video, Question } from '@/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    units: 0,
    topics: 0,
    videos: 0,
    questions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Add timeout to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const statsPromise = Promise.all([
        getDocs(collection(db, 'units')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'topics')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'videos')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'questions')).catch(() => ({ size: 0 }))
      ]);

      const [unitsSnap, topicsSnap, videosSnap, questionsSnap] = await Promise.race([
        statsPromise,
        timeout
      ]) as any[];

      setStats({
        units: unitsSnap.size || 0,
        topics: topicsSnap.size || 0,
        videos: videosSnap.size || 0,
        questions: questionsSnap.size || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default values if Firebase fails
      setStats({
        units: 0,
        topics: 0,
        videos: 0,
        questions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Dashboard</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Overview of Think-Tech course content management system
        </p>
        <div className="mt-3 text-sm text-blue-600">
          📚 Content Flow: Units → Topics → Videos/Notes/Questions
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Units" 
          value={stats.units}
          icon="📚"
          color="blue"
          href="/admin/units"
        />
        <StatCard 
          title="Total Topics" 
          value={stats.topics}
          icon="📖"
          color="green"
          href="/admin/topics"
        />
        <StatCard 
          title="Videos Uploaded" 
          value={stats.videos}
          icon="🎥"
          color="purple"
          href="/admin/videos"
        />
        <StatCard 
          title="Questions Created" 
          value={stats.questions}
          icon="❓"
          color="orange"
          href="/admin/questions"
        />
      </div>

      {/* Quick Actions and Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  href 
}: { 
  title: string; 
  value: number; 
  icon: string; 
  color: string; 
  href: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
  };

  return (
    <Link href={href}>
      <div className={`p-6 rounded-lg border-2 transition-colors cursor-pointer ${colorClasses[color as keyof typeof colorClasses]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </Link>
  );
}

function QuickActions() {
  const actions = [
    { title: 'Create New Unit', icon: '📚', href: '/admin/units/create', description: 'Start with course structure' },
    { title: 'Add Topics to Units', icon: '📖', href: '/admin/topics/create', description: 'Organize unit content' },
    { title: 'Upload Video Content', icon: '🎥', href: '/admin/videos/create', description: 'Add videos to topics' },
    { title: 'Create Study Notes', icon: '📝', href: '/admin/notes/create', description: 'Write topic notes' },
    { title: 'Add Practice Questions', icon: '❓', href: '/admin/questions/create', description: 'Create topic quizzes' },
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <Link 
            key={action.title}
            href={action.href}
            className="flex items-center w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <span className="text-xl mr-3">{action.icon}</span>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 block">
                {action.title}
              </span>
              <span className="text-xs text-gray-500">
                {action.description}
              </span>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900">Content Creation Flow</h3>
        <p className="text-xs text-blue-700 mt-1">
          1. Create Units → 2. Add Topics → 3. Upload Videos/Notes/Questions for each Topic
        </p>
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 text-sm">No recent activity</p>
          <p className="text-gray-400 text-xs mt-1">
            Recent Activities will appear here as you manage content
          </p>
        </div>
      </div>
    </div>
  );
}