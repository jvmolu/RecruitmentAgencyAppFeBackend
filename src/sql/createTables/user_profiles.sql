-- Enum for work_model
CREATE TYPE work_model AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');
CREATE TYPE budget_currency_type AS ENUM ('USD', 'EUR', 'INR');

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL ON DELETE CASCADE,
    about_me TEXT,
    current_address VARCHAR(255),
    current_yearly_salary INT,
    current_salary_currency budget_currency_type,
    resume_link TEXT,
    skills TEXT[],
    actively_searching BOOLEAN DEFAULT TRUE,
    work_location_preference work_model NOT NULL DEFAULT 'ONSITE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_skills ON user_profiles USING GIN(skills);
CREATE INDEX idx_user_profiles_actively_searching ON user_profiles(actively_searching);
CREATE INDEX idx_user_profiles_work_location_preference ON user_profiles(work_location_preference);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_user_profiles_updated_at ON user_profiles(updated_at);