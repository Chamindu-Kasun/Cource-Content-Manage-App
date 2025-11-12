'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', type: 'page' },
  { name: 'Course Structure', type: 'section' },
  { name: 'Units', href: '/admin/units', icon: '📚', type: 'page', indent: 1 },
  { name: 'Topics', href: '/admin/topics', icon: '📖', type: 'page', indent: 1 },
  { name: 'Content Management', type: 'section' },
  { name: 'Videos', href: '/admin/videos', icon: '🎥', type: 'page', indent: 1, subtitle: 'by Unit → Topic' },
  { name: 'Notes', href: '/admin/notes', icon: '📝', type: 'page', indent: 1, subtitle: 'by Unit → Topic' },
  { name: 'Questions', href: '/admin/questions', icon: '❓', type: 'page', indent: 1, subtitle: 'by Unit → Topic' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-sm border-r min-h-screen">
      <div className="p-6">
        <nav className="space-y-1">
          {navigation.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div key={index} className="pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.name}
                  </h3>
                </div>
              );
            }

            const isActive = pathname === item.href;
            const indentClass = item.indent ? 'ml-4' : '';
            
            return (
              <div key={item.name} className={indentClass}>
                <Link
                  href={item.href!}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <span>{item.name}</span>
                      {item.subtitle && (
                        <div className="text-xs text-gray-500">{item.subtitle}</div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}