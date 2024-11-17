import { DatabaseError as PgDatabaseError } from 'pg';
import { IDatabaseError } from './i-database-error';
import { errorCodes } from '../../common/db-error-codes';

export class DatabaseErrorHandler {
    
    static handle(error: PgDatabaseError): IDatabaseError {

        const dbError: IDatabaseError = error as IDatabaseError;    

        switch (dbError.code) {
            case errorCodes.UNIQUE_VIOLATION:
                dbError.statusCode = 409;
                dbError.businessMessage = 'Record already exists';
                break;
            case errorCodes.FOREIGN_KEY_VIOLATION:
                dbError.statusCode = 404;
                dbError.businessMessage = 'Referenced record not found';
                break;
            default:
                dbError.statusCode = 500;
                dbError.businessMessage = 'Database error occurred';
        }
      
        return dbError;
    }
  }