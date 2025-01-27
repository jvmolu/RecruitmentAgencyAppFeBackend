-- ADD COLUMN SIMILARITY SCORE
ALTER TABLE matches
ADD COLUMN similarity_score FLOAT DEFAULT 0.0;

-- ADD CONSTRAINT THAT job_id and candidate_id combination should be unique
ALTER TABLE matches
ADD CONSTRAINT unique_job_candidate_match UNIQUE (job_id, candidate_id);