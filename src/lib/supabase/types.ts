export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'instructor' | 'admin';
export type LessonType = 'video' | 'live' | 'document' | 'quiz';
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: user_role;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export type user_role = UserRole;

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category: string;
  instructor_id: string;
  is_published: boolean;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  type: LessonType;
  video_url?: string | null;
  content_markdown?: string | null;
  duration_seconds: number;
  order_index: number;
  is_free_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  watched_seconds: number;
  last_accessed_at: string;
}

export interface ChatMessage {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  is_instructor_reply: boolean;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url?: string | null;
    role: UserRole;
  };
}

export interface CourseResource {
  id: string;
  course_id: string;
  lesson_id?: string | null;
  title: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

export interface StudentSubmission {
  id: string;
  lesson_id: string;
  student_id: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  comment?: string | null;
  feedback?: string | null;
  grade?: number | null;
  created_at: string;
}
