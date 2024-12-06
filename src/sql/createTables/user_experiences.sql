-- Create user_experiences table
CREATE TABLE user_experiences (
    id UUID PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE,
    description TEXT
);

-- Indexes
CREATE INDEX idx_user_experiences_user_profiles_id ON user_experiences(user_profile_id);