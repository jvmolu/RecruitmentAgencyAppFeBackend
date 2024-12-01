-- src/sql/createTables/match_reports.sql
CREATE TABLE match_reports (
    id UUID PRIMARY KEY,
    report JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_match_reports_created_at ON match_reports(created_at);