-- Create user_experiences table
CREATE TABLE user_experiences (
    id UUID PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_experiences_user_profiles_id ON user_experiences(user_profile_id);
CREATE INDEX idx_user_experiences_created_at ON user_experiences(created_at);