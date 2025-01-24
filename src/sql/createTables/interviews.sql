CREATE TYPE interview_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status interview_status NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    total_marks INTEGER NOT NULL DEFAULT 0,
    obtained_marks INTEGER NOT NULL DEFAULT 0,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    total_questions_to_ask INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    estimated_time_minutes INTEGER NOT NULL DEFAULT 4,
    answer TEXT,
    video_link TEXT,
    sequence_number INTEGER NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT true,
    category TEXT NOT NULL,
    total_marks INTEGER NOT NULL DEFAULT 0,
    obtained_marks INTEGER NOT NULL DEFAULT 0,
    is_checked BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(interview_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id ON interview_questions(interview_id);