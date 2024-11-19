// src/types/database.types.ts
import { DatabaseError as PgDatabaseError } from 'pg';;

// Create Type Instead which extends PgDatabaseError
export type DatabaseError = PgDatabaseError & {
    statusCode: number;
    businessMessage: string;
    errorType: "DatabaseError";
};