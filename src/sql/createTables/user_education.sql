-- Create user_education table
CREATE TABLE user_education (
    id UUID PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course TEXT NOT NULL,
    institute TEXT NOT NULL,
    cgpa NUMERIC(3,2),
    passing_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_education_user_profiles_id ON user_education(user_profile_id);
CREATE INDEX idx_user_education_passing_year ON user_education(passing_year);
CREATE INDEX idx_user_education_created_at ON user_education(created_at);