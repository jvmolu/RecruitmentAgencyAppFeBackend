ALTER TABLE applications
    ADD COLUMN match_report_id UUID REFERENCES match_reports(id);
