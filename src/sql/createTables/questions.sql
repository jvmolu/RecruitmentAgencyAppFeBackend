CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    time_limit INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_created_at ON questions(created_at);

INSERT INTO questions (question_text, time_limit) VALUES
('Tell me about yourself', 120),
('What are your strengths?', 90),
('Why do you want this job?', 90),
('Where do you see yourself in 5 years?', 90),
('What is your biggest achievement?', 90),
('How do you handle stress?', 90),
('What are your salary expectations?', 90),
('Why should we hire you?', 90),
('Do you have any questions for us?', 90),
('Describe your ideal work environment', 90);