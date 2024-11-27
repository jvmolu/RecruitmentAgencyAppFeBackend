import { DatabaseError as PgDatabaseError } from 'pg';
import { DatabaseError } from '../types/error/database-error';
import { errorCodes } from '../common/db-error-codes';
import { FailureResponse } from '../types/response/general-app-response';
import HttpStatusCode from '../types/enums/http-status-codes';

export class DatabaseErrorHandler {
    
    static handle(error: PgDatabaseError): FailureResponse {

        const dbError: DatabaseError = error as DatabaseError;    
        dbError.errorType = 'DatabaseError';

        const failureResponse : FailureResponse = {
            error: dbError,
            businessMessage: 'Database error occurred',
            statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            success: false
        };

        switch (dbError.code) {
            case errorCodes.UNIQUE_VIOLATION:
                failureResponse.statusCode = HttpStatusCode.CONFLICT;
                failureResponse.businessMessage = 'Record already exists';
                break;
            case errorCodes.FOREIGN_KEY_VIOLATION:
                failureResponse.statusCode = HttpStatusCode.NOT_FOUND;
                failureResponse.businessMessage = 'Referenced record not found';
                break;
            default:
                failureResponse.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
                failureResponse.businessMessage = 'Database error occurred';
        }

        return failureResponse;
    }
  }