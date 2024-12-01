-- src/sql/createTables/matches.sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  match_report_id UUID NOT NULL,
  job_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE matches
ADD CONSTRAINT fk_matches_match_report
FOREIGN KEY (match_report_id)
REFERENCES match_reports(id);

ALTER TABLE matches
ADD CONSTRAINT fk_matches_job
FOREIGN KEY (job_id)
REFERENCES jobs(id);

ALTER TABLE matches
ADD CONSTRAINT fk_matches_candidate
FOREIGN KEY (candidate_id)
REFERENCES users(id);

CREATE INDEX idx_matches_match_report_id ON matches(match_report_id);
CREATE INDEX idx_matches_job_id ON matches(job_id);
CREATE INDEX idx_matches_candidate_id ON matches(candidate_id);