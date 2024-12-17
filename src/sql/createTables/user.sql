-- Create ENUM types
CREATE TYPE user_role AS ENUM ('ADMIN', 'CANDIDATE');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CANDIDATE',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_updated_at ON users(updated_at);

-- SELECT AND SEE EVERYTHING WAS CREATED
-- SELECT * FROM pg_enum;
-- SELECT * FROM pg_type;
-- SELECT * FROM pg_class WHERE relkind = 'r' AND relname = 'users';
-- SELECT * FROM pg_index WHERE indrelid = 'users'::regclass;