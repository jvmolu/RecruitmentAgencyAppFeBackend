-- Create user_education table
CREATE TABLE user_education (
    id UUID PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course VARCHAR(255) NOT NULL,
    institute VARCHAR(255) NOT NULL,
    cgpa NUMERIC(3,2),
    passing_year INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_user_education_user_profiles_id ON user_education(user_profile_id);