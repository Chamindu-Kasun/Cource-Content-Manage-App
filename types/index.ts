export interface Unit {
  id?: string;
  unit_number: number;
  unit_title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface Topic {
  id?: string;
  unit_id: string;
  topic_title: string;
  topic_order: number;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface Video {
  id?: string;
  topic_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  thumbnail_url: string;
  created_at: Date;
  order_index: number;
}

export interface Note {
  id?: string;
  topic_id: string;
  title: string;
  content: string;
  images: NoteImage[];
  attachments: Attachment[];
  created_at: Date;
  updated_at: Date;
}

export interface NoteImage {
  url: string;
  caption: string;
  alt_text: string;
}

export interface Attachment {
  url: string;
  filename: string;
  file_type: string;
  file_size: number;
}

export interface Question {
  id?: string;
  topic_id: string;
  question_type: 'mcq' | 'essay';
  question_text: string;
  images: QuestionImage[];
  options?: QuestionOption[];
  correct_answer?: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  created_at: Date;
}

export interface QuestionImage {
  url: string;
  caption: string;
  alt_text: string;
}

export interface QuestionOption {
  text: string;
  is_correct: boolean;
  explanation: string;
}

// API Response Types for external applications
export interface ApiTopicContent {
  topic_content: string;
  questions: ApiQuestion[];
  notes: ApiNote[];
  videos: ApiVideo[];
}

export interface ApiUnitResponse {
  unit_number: number;
  unit_title: string;
  topics: ApiTopicContent[];
}

export interface ApiUnitsResponse {
  units: ApiUnitResponse[];
}

// Simplified API content types
export interface ApiVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  order_index: number;
}

export interface ApiNote {
  id: string;
  title: string;
  content: string;
  note_type?: string;
  created_at: any;
}

export interface ApiQuestion {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'essay';
  difficulty_level: 'easy' | 'medium' | 'hard';
  options?: { text: string; is_correct: boolean }[] | null;
  correct_answer: string;
  explanation: string;
}