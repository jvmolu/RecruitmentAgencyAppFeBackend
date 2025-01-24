-- Create ENUM types
CREATE TYPE company_status AS ENUM ('ACTIVE', 'INACTIVE');

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    website TEXT UNIQUE,
    address TEXT,
    is_partner BOOLEAN NOT NULL DEFAULT FALSE,
    status company_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Index for prefix search on name column
CREATE INDEX idx_companies_name_prefix_trgm ON companies USING gin (name gin_trgm_ops);