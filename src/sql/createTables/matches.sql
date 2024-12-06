-- src/sql/createTables/matches.sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  match_report_id UUID REFERENCES match_reports(id),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_match_report_id ON matches(match_report_id);
CREATE INDEX idx_matches_job_id ON matches(job_id);
CREATE INDEX idx_matches_candidate_id ON matches(candidate_id);
CREATE INDEX idx_matches_created_at ON matches(created_at);
CREATE INDEX idx_matches_updated_at ON matches(updated_at);
CREATE INDEX idx_matches_job_id_candidate_id ON matches(job_id, candidate_id);