CREATE TYPE application_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE application_stages AS ENUM ('INVITED', 'APPLIED', 'SHORTLISTED', 'AI_INTERVIEW', 'INTERVIEW', 'OFFERED', 'REJECTED');
CREATE TYPE budget_per_type AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR', 'ONETIME');
CREATE TYPE budget_currency_type AS ENUM ('USD', 'EUR', 'INR');

CREATE TABLE applications (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_description_map JSON NOT NULL,
    general_work_exp TEXT NOT NULL,
    current_address TEXT NOT NULL,
    expected_budget_amount INT,
    expected_budget_currency budget_currency_type,
    expected_budget_per budget_per_type,
    notice_period INT NOT NULL,
    resume_link TEXT NOT NULL,
    cover_letter TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'ACTIVE',
    stage application_stages NOT NULL DEFAULT 'APPLIED',
    invite_id UUID DEFAULT NULL REFERENCES invites(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Constraint -> Combination of candidate_id and job_id should be unique
ALTER TABLE applications
ADD CONSTRAINT candidate_job_unique UNIQUE (candidate_id, job_id);

CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_stage ON applications(stage);
CREATE INDEX idx_applications_created_at ON applications(created_at);