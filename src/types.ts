export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'student' | 'creator';
  status: 'active' | 'blocked' | 'pending';
  created_at?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  access_type: 'free' | 'premium' | 'subscription';
  visibility: 'public' | 'private' | 'hidden';
  price: number;
  status: 'draft' | 'published';
  created_by?: number;
  created_at?: string;
  isEnrolled?: boolean;
  enrollmentType?: 'free' | 'paid' | 'subscription' | null;
  expiresAt?: string | null;
  external_url?: string;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  module_order: number;
  created_at?: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  course_id: number;
  module_id: number;
  title: string;
  slug: string;
  source_url: string;
  source_type: 'video' | 'pdf' | 'audio' | 'iframe' | 'external' | 'download';
  access_level: 'free' | 'premium';
  lesson_order: number;
  drip_days: number;
  duration_minutes: number;
  created_at?: string;
  progress?: {
    percent: number;
    completed: boolean;
    last_accessed: string;
  } | null;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  access_type: 'free' | 'paid' | 'subscription';
  expires_at?: string | null;
  created_at?: string;
}

export interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  course_title?: string;
  payment_provider: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at?: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  provider_subscription_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired';
  started_at?: string;
  expires_at?: string;
}

export interface LessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  progress_percent: number;
  completed: boolean;
  last_accessed?: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number | null;
  email?: string;
  role?: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  course_title?: string;
  course_thumbnail?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  certificate_code: string;
  pdf_url: string;
  template_style?: string; // 'classical' | 'modern' | 'minimalist' | 'tech_dark' | 'luxury_gold'
  created_at: string;
}

