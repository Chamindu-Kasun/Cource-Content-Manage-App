'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Unit } from '@/types';
import Link from 'next/link';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('permissions')) {
        alert('Firebase permissions error. Please check Firestore security rules.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit? This will also delete all associated topics, videos, notes, and questions.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'units', unitId));
      await loadUnits(); // Refresh the list
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Failed to delete unit');
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Units</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage course units for the database course
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/units/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Unit
          </Link>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">📚</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No units</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new unit.</p>
          <div className="mt-6">
            <Link
              href="/admin/units/create"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Unit
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {units.map((unit) => (
              <li key={unit.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {unit.unit_number}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {unit.unit_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {unit.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/units/${unit.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <button
                      onClick={() => handleDeleteUnit(unit.id!)}
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