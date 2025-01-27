DO $$
DECLARE
    col RECORD;
BEGIN
    FOR col IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'interview_questions' AND data_type = 'character varying'
    LOOP
        EXECUTE FORMAT('ALTER TABLE %I ALTER COLUMN %I TYPE TEXT;', 'interview_questions', col.column_name);
    END LOOP;
END $$;