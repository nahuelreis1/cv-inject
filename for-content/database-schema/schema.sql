-- ==========================================
-- CV Prompt Injection Tool - Database Schema
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- Functions & Triggers
-- ==========================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update completed_jobs in batches table
CREATE OR REPLACE FUNCTION update_batch_completed_jobs()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.batch_id IS NOT NULL THEN
        UPDATE batches
        SET completed_jobs = completed_jobs + 1
        WHERE id = NEW.batch_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- Tables
-- ==========================================

-- Users
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE users IS 'Stores user accounts and profiles.';

-- CVs
CREATE TABLE cvs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename text NOT NULL,
    original_text text NOT NULL,
    pages integer DEFAULT 1,
    file_size integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE cvs IS 'Stores uploaded CVs and their extracted text.';

-- Jobs
CREATE TABLE jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url text NOT NULL,
    title text,
    company text,
    requirements jsonb DEFAULT '[]'::jsonb,
    keywords jsonb DEFAULT '[]'::jsonb,
    full_text text,
    seniority text,
    scraped_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE jobs IS 'Stores scraped job postings from LinkedIn.';

-- Batches
CREATE TABLE batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    total_jobs integer DEFAULT 0,
    completed_jobs integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE batches IS 'Tracks batch processing of multiple jobs for a CV.';

-- Generations
CREATE TABLE generations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id uuid NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
    visible_text text,
    invisible_injections jsonb DEFAULT '[]'::jsonb,
    invisible_keywords jsonb DEFAULT '[]'::jsonb,
    pdf_url text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    match_score integer CHECK (match_score >= 0 AND match_score <= 100),
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    UNIQUE (cv_id, job_id)
);
COMMENT ON TABLE generations IS 'Stores the generated optimized CVs with prompt injections.';

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON cvs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_batch_completed_jobs
AFTER UPDATE ON generations
FOR EACH ROW
EXECUTE FUNCTION update_batch_completed_jobs();

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_jobs_url ON jobs(url);
CREATE INDEX idx_generations_cv_id ON generations(cv_id);
CREATE INDEX idx_generations_job_id ON generations(job_id);
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_jobs_requirements_gin ON jobs USING GIN (requirements);
CREATE INDEX idx_jobs_keywords_gin ON jobs USING GIN (keywords);

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- CVs
CREATE POLICY "Users can view own CVs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CVs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON cvs FOR DELETE USING (auth.uid() = user_id);

-- Jobs
CREATE POLICY "Anyone can view jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert jobs" ON jobs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Batches
CREATE POLICY "Users can view own batches" ON batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own batches" ON batches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own batches" ON batches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own batches" ON batches FOR DELETE USING (auth.uid() = user_id);

-- Generations
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generations" ON generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generations" ON generations FOR DELETE USING (auth.uid() = user_id);
