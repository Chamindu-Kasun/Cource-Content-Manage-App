'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { Unit } from '@/types';
import Link from 'next/link';

type UnitFormData = {
  unit_number: number;
  unit_title: string;
  description: string;
};

export default function EditUnitPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UnitFormData>();

  useEffect(() => {
    loadUnit();
  }, [params.id]);

  const loadUnit = async () => {
    try {
      const docRef = doc(db, 'units', params.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const unitData = { id: docSnap.id, ...docSnap.data() } as Unit;
        setUnit(unitData);
        setValue('unit_number', unitData.unit_number);
        setValue('unit_title', unitData.unit_title);
        setValue('description', unitData.description);
      } else {
        console.error('Unit not found');
        router.push('/admin/units');
      }
    } catch (error) {
      console.error('Error loading unit:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: UnitFormData) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'units', params.id);
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date(),
      });
      router.push('/admin/units');
    } catch (error) {
      console.error('Error updating unit:', error);
      alert('Failed to update unit');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Unit not found</h3>
        <p className="mt-1 text-sm text-gray-500">The unit you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link
            href="/admin/units"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Back to Units
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/units"
            className="text-gray-400 hover:text-gray-500"
          >
            ← Back to Units
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-6 text-gray-900">Edit Unit</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update unit information for the database course
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Unit Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Basic information about the course unit.
              </p>
            </div>
            <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">
              <div>
                <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                  Unit Number
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    {...register('unit_number', {
                      required: 'Unit number is required',
                      min: { value: 1, message: 'Unit number must be positive' },
                    })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="1"
                  />
                  {errors.unit_number && (
                    <p className="mt-2 text-sm text-red-600">{errors.unit_number.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="unit_title" className="block text-sm font-medium text-gray-700">
                  Unit Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('unit_title', {
                      required: 'Unit title is required',
                      minLength: { value: 3, message: 'Title must be at least 3 characters' },
                    })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Introduction to Databases"
                  />
                  {errors.unit_title && (
                    <p className="mt-2 text-sm text-red-600">{errors.unit_title.message}</p>
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
                    placeholder="Brief description of what this unit covers..."
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
            href="/admin/units"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Unit'}
          </button>
        </div>
      </form>
    </div>
  );
}