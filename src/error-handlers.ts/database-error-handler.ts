import { DatabaseError as PgDatabaseError } from 'pg';
import { DatabaseError } from '../types/error/database-error';
import { errorCodes } from '../common/db-error-codes';
import { FailureResponse } from '../types/response/general-app-response';

export class DatabaseErrorHandler {
    
    static handle(error: PgDatabaseError): FailureResponse {

        const dbError: DatabaseError = error as DatabaseError;    
        dbError.errorType = 'DatabaseError';

        const failureResponse : FailureResponse = {
            error: dbError,
            businessMessage: 'Database error occurred',
            statusCode: 500,
            success: false
        };

        switch (dbError.code) {
            case errorCodes.UNIQUE_VIOLATION:
                failureResponse.statusCode = 409;
                failureResponse.businessMessage = 'Record already exists';
                break;
            case errorCodes.FOREIGN_KEY_VIOLATION:
                failureResponse.statusCode = 404;
                failureResponse.businessMessage = 'Referenced record not found';
                break;
            default:
                failureResponse.statusCode = 500;
                failureResponse.businessMessage = 'Database error occurred';
        }

        return failureResponse;
    }
  }