import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  domain: string;
  data_type: 'tabular' | 'timeseries' | 'text' | 'image';
  status: 'draft' | 'generating' | 'completed' | 'failed';
  config: any;
  created_at: string;
  updated_at: string;
}

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_size: number;
  rows_count: number;
  columns_count: number;
  schema: any;
  quality_score: number;
  privacy_score: number;
  bias_score: number;
  created_at: string;
}

export interface GenerationJob {
  id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  config: any;
  result_dataset_id?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}