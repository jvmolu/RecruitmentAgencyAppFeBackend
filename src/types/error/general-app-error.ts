import { AuthError } from "./auth-error";
import { DataNotFoundError } from "./data-not-found-error";
import { DatabaseError } from "./database-error";
import { EmailSendError } from "./email-send-error";
import { ZodParsingError } from "./zod-parsing-error";

// General Error Type to be used accross application
export type GeneralAppError = ZodParsingError | DatabaseError | AuthError | DataNotFoundError | EmailSendError;

// Type Guard Functions
export function isDatabaseError(error: GeneralAppError): error is DatabaseError {
    return (error as DatabaseError).errorType === "DatabaseError";
}

export function isZodError(error: GeneralAppError): error is ZodParsingError {
    return (error as ZodParsingError).errorType === "ZodParsingError";
}

export function isAuthError(error: GeneralAppError): error is AuthError {
    return (error as AuthError).errorType === "AuthError";
}

export function isDataNotFoundError(error: GeneralAppError): error is DataNotFoundError {
    return (error as DataNotFoundError).errorType === "DataNotFoundError";
}

export function isEmailSendError(error: GeneralAppError): error is EmailSendError {
    return (error as EmailSendError).errorType === "EmailSendError";
}