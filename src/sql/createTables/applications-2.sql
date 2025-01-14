ALTER TABLE applications
    ALTER COLUMN skill_description_map SET DATA TYPE JSONB USING skill_description_map::JSONB;