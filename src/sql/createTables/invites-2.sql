-- Create ENUM types
CREATE TYPE invite_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

ALTER TABLE invites
    ADD COLUMN status invite_status NOT NULL DEFAULT 'PENDING';

-- Create indexes
CREATE INDEX idx_invites_status ON invites(status);