'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { Unit } from '@/types';
import Link from 'next/link';

type UnitFormData = {
  unit_number: number;
  unit_title: string;
  description: string;
};

export default function CreateUnitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitFormData>();

  const onSubmit = async (data: UnitFormData) => {
    setLoading(true);
    try {
      const unitData: Omit<Unit, 'id'> = {
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await addDoc(collection(db, 'units'), unitData);
      router.push('/admin/units');
    } catch (error) {
      console.error('Error creating unit:', error);
      alert('Failed to create unit');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="mt-4 text-3xl font-bold leading-6 text-gray-900">Create New Unit</h1>
        <p className="mt-2 text-sm text-gray-700">
          Add a new unit to the database course
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
            {loading ? 'Creating...' : 'Create Unit'}
          </button>
        </div>
      </form>
    </div>
  );
}