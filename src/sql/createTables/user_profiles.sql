-- Enum for work_model
CREATE TYPE work_model AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');
CREATE TYPE budget_currency_type AS ENUM ('USD', 'EUR', 'INR');

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    about_me TEXT,
    country_code VARCHAR(10),
    phone BIGINT UNIQUE,
    current_address TEXT,
    current_yearly_salary INT,
    current_salary_currency budget_currency_type,
    resume_link TEXT,
    skills TEXT[],
    actively_searching BOOLEAN DEFAULT TRUE,
    total_exp_in_yrs NUMERIC(4, 2), -- 4, 2 means 4 digits in total and 2 after decimal
    work_location_preference work_model NOT NULL DEFAULT 'ONSITE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Constraint that Country Code and Phone number will both be null or both be not null
ALTER TABLE user_profiles
ADD CONSTRAINT country_code_phone_all_or_none CHECK (
    (
        country_code IS NULL AND 
        phone IS NULL
    ) 
    OR 
    (
        country_code IS NOT NULL AND 
        phone IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_skills ON user_profiles USING GIN(skills);
CREATE INDEX idx_user_profiles_actively_searching ON user_profiles(actively_searching);
CREATE INDEX idx_user_profiles_work_location_preference ON user_profiles(work_location_preference);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_user_profiles_updated_at ON user_profiles(updated_at);