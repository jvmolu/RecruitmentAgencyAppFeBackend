CREATE TABLE invites (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Foreign Key Constraints
ALTER TABLE invites
ADD CONSTRAINT fk_invites_job
FOREIGN KEY (job_id)
REFERENCES jobs(id);

ALTER TABLE invites
ADD CONSTRAINT fk_invites_candidate
FOREIGN KEY (candidate_id)
REFERENCES users(id);

-- Create indexes
CREATE INDEX idx_invites_job_id ON invites(job_id);
CREATE INDEX idx_invites_candidate_id ON invites(candidate_id);