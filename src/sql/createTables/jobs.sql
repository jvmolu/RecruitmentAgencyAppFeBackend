-- Create ENUM types
CREATE TYPE job_type AS ENUM ('FULLTIME', 'PARTTIME');
CREATE TYPE contract_type AS ENUM ('PERMANENT', 'FREELANCE');
CREATE TYPE work_model AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');
CREATE TYPE job_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE budget_per_type AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR', 'ONETIME');
CREATE TYPE budget_currency_type AS ENUM ('USD', 'EUR', 'INR');

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES companies(id),
    experience_required INT NOT NULL,
    budget_amount INT,
    budget_currency budget_currency_type,
    budget_per budget_per_type,
    job_type job_type NOT NULL,
    contract_type contract_type NOT NULL,
    title TEXT NOT NULL,
    objective TEXT,
    goals TEXT,
    job_description TEXT,
    skills TEXT[],
    quantity INT NOT NULL,
    required_by DATE NOT NULL,
    hidden_columns TEXT[],
    location TEXT NOT NULL,
    work_model work_model NOT NULL,
    status job_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Constraints
-- Add constraint for budget fields
ALTER TABLE jobs
ADD CONSTRAINT budget_fields_all_or_none CHECK (
    (
        budget_amount IS NULL AND 
        budget_currency IS NULL AND 
        budget_per IS NULL
    ) 
    OR 
    (
        budget_amount IS NOT NULL AND 
        budget_currency IS NOT NULL AND 
        budget_per IS NOT NULL
    )
);

-- Create indexes
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_partner_id ON jobs(partner_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_required_by ON jobs(required_by);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_work_model ON jobs(work_model);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_contract_type ON jobs(contract_type);

-- Index for prefix search on title column
CREATE INDEX idx_jobs_title_prefix_trgm ON jobs USING gin (title gin_trgm_ops);

-- Index to search for skills
CREATE INDEX idx_jobs_skills ON jobs USING gin (skills);

-- BUDGET Related Indexes
-- Create a composite index for budget queries
-- If you frequently search by amount range without other conditions:
CREATE INDEX idx_jobs_budget_amount ON jobs(budget_amount);
CREATE INDEX idx_jobs_budget_composite ON jobs(budget_per, budget_currency, budget_amount);