export interface User {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface CV {
  id: string;
  user_id?: string;
  filename: string;
  original_text: string;
  pages: number;
  file_size: number;
  storage_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  url: string;
  title: string;
  company: string;
  requirements: string[];
  keywords: string[];
  full_text: string;
  seniority: string;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  cv_id: string;
  job_id: string;
  user_id?: string;
  batch_id?: string;
  visible_text: string;
  invisible_injections: Record<string, string>;
  invisible_keywords: string[];
  pdf_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  match_score: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Batch {
  id: string;
  user_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_jobs: number;
  completed_jobs: number;
  created_at: string;
  updated_at: string;
}
