-- Create ENUM types
CREATE TYPE invite_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

ALTER TABLE invites
    ADD COLUMN status invite_status NOT NULL DEFAULT 'PENDING';

-- Create indexes
CREATE INDEX idx_invites_status ON invites(status);

-- Add a constraint that only one invite can be sent to a candidate for a job
ALTER TABLE invites
    ADD CONSTRAINT unique_job_candidate_invite UNIQUE (job_id, candidate_id);