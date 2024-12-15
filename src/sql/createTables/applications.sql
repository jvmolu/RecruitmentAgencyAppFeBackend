CREATE TYPE application_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE application_stages AS ENUM ('INVITED', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED');
CREATE TYPE budget_per_type AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR', 'ONETIME');
CREATE TYPE budget_currency_type AS ENUM ('USD', 'EUR', 'INR');

CREATE TABLE applications (
    id UUID PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_description_map JSON NOT NULL,
    general_work_exp VARCHAR(255) NOT NULL,
    current_address VARCHAR(255) NOT NULL,
    expected_budget_amount INT,
    expected_budget_currency budget_currency_type,
    expected_budget_per budget_per_type,
    notice_period INT NOT NULL,
    resume_link VARCHAR(255) NOT NULL,
    cover_letter TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'ACTIVE',
    stage application_stages NOT NULL DEFAULT 'APPLIED',
    invite_id UUID DEFAULT NULL REFERENCES invites(id)
);

CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_stage ON applications(stage);