// src/types/database.types.ts
import { DatabaseError as PgDatabaseError } from 'pg';;

export interface IDatabaseError extends PgDatabaseError {
    statusCode: number;
    businessMessage: string;
}