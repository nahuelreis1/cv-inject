-- ==========================================
-- CV Prompt Injection Tool - Seed Data
-- ==========================================

-- Insert Users
INSERT INTO users (id, email) VALUES
('d1b12345-1234-1234-1234-123456789012', 'john.doe@example.com'),
('d2b12345-1234-1234-1234-123456789012', 'jane.smith@example.com');

-- Insert CVs
INSERT INTO cvs (id, user_id, filename, original_text, pages, file_size) VALUES
('c1b12345-1234-1234-1234-123456789012', 'd1b12345-1234-1234-1234-123456789012', 'John_Doe_Resume_2023.pdf', 'John Doe\nSoftware Engineer\nExperience: 5 years in React and Node.js...', 2, 102400),
('c2b12345-1234-1234-1234-123456789012', 'd2b12345-1234-1234-1234-123456789012', 'Jane_Smith_CV_Marketing.pdf', 'Jane Smith\nMarketing Manager\nSkills: SEO, Content Strategy, Google Analytics...', 1, 85000);

-- Insert Jobs
INSERT INTO jobs (id, url, title, company, requirements, keywords, full_text, seniority) VALUES
('j1b12345-1234-1234-1234-123456789012', 'https://linkedin.com/jobs/view/123456', 'Senior Frontend Developer', 'TechCorp', '["React", "TypeScript", "5+ years experience"]', '["React", "TypeScript", "Frontend", "Web Performance"]', 'We are looking for a Senior Frontend Developer to join our team...', 'Senior'),
('j2b12345-1234-1234-1234-123456789012', 'https://linkedin.com/jobs/view/654321', 'Digital Marketing Lead', 'GrowthInc', '["SEO", "Team Leadership", "B2B Marketing"]', '["SEO", "B2B", "Leadership", "Analytics"]', 'GrowthInc is hiring a Digital Marketing Lead...', 'Lead');

-- Insert Batches
INSERT INTO batches (id, user_id, status, total_jobs, completed_jobs) VALUES
('b1b12345-1234-1234-1234-123456789012', 'd1b12345-1234-1234-1234-123456789012', 'completed', 1, 1),
('b2b12345-1234-1234-1234-123456789012', 'd2b12345-1234-1234-1234-123456789012', 'pending', 1, 0);

-- Insert Generations
INSERT INTO generations (id, cv_id, job_id, user_id, batch_id, visible_text, invisible_injections, invisible_keywords, pdf_url, status, match_score, completed_at) VALUES
('g1b12345-1234-1234-1234-123456789012', 'c1b12345-1234-1234-1234-123456789012', 'j1b12345-1234-1234-1234-123456789012', 'd1b12345-1234-1234-1234-123456789012', 'b1b12345-1234-1234-1234-123456789012', 'John Doe\nSenior Frontend Developer\nExperience: 5 years in React and Node.js...', '[{"section": "Experience", "original": "React", "justification": "Matches the core requirement for React development"}]', '["TypeScript", "Web Performance"]', 'https://storage.supabase.com/cvs/g1b12345.pdf', 'completed', 95, now()),
('g2b12345-1234-1234-1234-123456789012', 'c2b12345-1234-1234-1234-123456789012', 'j2b12345-1234-1234-1234-123456789012', 'd2b12345-1234-1234-1234-123456789012', 'b2b12345-1234-1234-1234-123456789012', NULL, '[]', '[]', NULL, 'pending', NULL, NULL);
