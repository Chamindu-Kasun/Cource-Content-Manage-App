'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm, useFieldArray } from 'react-hook-form';
import { Question, Topic, Unit, QuestionOption } from '@/types';
import Link from 'next/link';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

type QuestionFormData = {
  topic_id: string;
  question_type: 'mcq' | 'essay';
  question_text: string;
  options?: {
    text: string;
    is_correct: boolean;
    explanation: string;
  }[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
};

export default function CreateQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<(Topic & { unit_title?: string })[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm<QuestionFormData>({
    defaultValues: {
      question_type: 'mcq',
      difficulty: 'medium',
      points: 5,
      options: [
        { text: '', is_correct: false, explanation: '' },
        { text: '', is_correct: false, explanation: '' },
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options"
  });

  const questionType = watch('question_type');

  useEffect(() => {
    loadData();
  }, []);

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

  const onSubmit = async (data: QuestionFormData) => {
    setLoading(true);
    try {
      // Validate MCQ questions
      if (data.question_type === 'mcq') {
        const correctAnswers = data.options?.filter(opt => opt.is_correct) || [];
        if (correctAnswers.length !== 1) {
          alert('MCQ questions must have exactly one correct answer.');
          setLoading(false);
          return;
        }
      }

      const questionData: Omit<Question, 'id'> = {
        topic_id: data.topic_id,
        question_type: data.question_type,
        question_text: data.question_text,
        images: [],
        options: data.question_type === 'mcq' ? data.options : undefined,
        explanation: data.explanation,
        difficulty: data.difficulty,
        points: Number(data.points),
        created_at: new Date(),
      };

      await addDoc(collection(db, 'questions'), questionData);
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/questions"
            className="text-gray-400 hover:text-gray-500"
          >
            ← Back to Questions
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-6 text-gray-900">Create Practice Question</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new practice question for students
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-800">
            <h3 className="font-medium">No topics available</h3>
            <p className="mt-1 text-sm">You need to create at least one topic before adding questions.</p>
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
          {/* Basic Information */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Question Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Basic details about the practice question.
                </p>
              </div>
              <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">
                <div>
                  <label htmlFor="topic_id" className="block text-sm font-medium text-gray-700">
                    Topic
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('topic_id', { required: 'Please select a topic' })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select a topic...</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.unit_title} - {topic.topic_title}
                        </option>
                      ))}
                    </select>
                    {errors.topic_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.topic_id.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="question_type" className="block text-sm font-medium text-gray-700">
                    Question Type
                  </label>
                  <div className="mt-1">
                    <select
                      {...register('question_type', { required: 'Please select a question type' })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="mcq">Multiple Choice Question (MCQ)</option>
                      <option value="essay">Essay Question</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                      Difficulty
                    </label>
                    <div className="mt-1">
                      <select
                        {...register('difficulty', { required: 'Please select difficulty' })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                      Points
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        {...register('points', {
                          required: 'Points are required',
                          min: { value: 1, message: 'Points must be positive' },
                        })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="5"
                      />
                      {errors.points && (
                        <p className="mt-2 text-sm text-red-600">{errors.points.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="question_text" className="block text-sm font-medium text-gray-700">
                    Question Text
                  </label>
                  <div className="mt-1">
                    <textarea
                      rows={4}
                      {...register('question_text', {
                        required: 'Question text is required',
                        minLength: { value: 10, message: 'Question must be at least 10 characters' },
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="What is the purpose of a primary key in a relational database?"
                    />
                    {errors.question_text && (
                      <p className="mt-2 text-sm text-red-600">{errors.question_text.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MCQ Options */}
          {questionType === 'mcq' && (
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Answer Options</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add multiple choice options. Mark exactly one as correct.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Option {index + 1}
                          </h4>
                          {fields.length > 2 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <input
                              {...register(`options.${index}.text`, {
                                required: 'Option text is required'
                              })}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="Enter option text..."
                            />
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register(`options.${index}.is_correct`)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              This is the correct answer
                            </label>
                          </div>
                          
                          <div>
                            <input
                              {...register(`options.${index}.explanation`)}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="Explanation for this option (optional)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => append({ text: '', is_correct: false, explanation: '' })}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Option
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Explanation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Provide a detailed explanation of the correct answer or approach.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div>
                  <textarea
                    rows={6}
                    {...register('explanation', {
                      required: 'Explanation is required',
                      minLength: { value: 20, message: 'Explanation must be at least 20 characters' },
                    })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Explain the correct answer and provide additional context or learning points..."
                  />
                  {errors.explanation && (
                    <p className="mt-2 text-sm text-red-600">{errors.explanation.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/questions"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}