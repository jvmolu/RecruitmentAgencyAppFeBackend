-- ADD COLUMN SIMILARITY SCORE
ALTER TABLE matches
ADD COLUMN similarity_score NUMERIC(3,2) DEFAULT 0.0;