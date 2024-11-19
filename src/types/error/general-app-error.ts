import { DatabaseError } from "./database-error";
import { ZodParsingError } from "./zod-parsing-error";

// General Error Type to be used accross application
export type GeneralAppError = ZodParsingError | DatabaseError;

// Type Guard Functions
export function isDatabaseError(error: GeneralAppError): error is DatabaseError {
    return (error as DatabaseError).errorType === "DatabaseError";
}

export function isZodError(error: GeneralAppError): error is ZodParsingError {
    return (error as ZodParsingError).errorType === "ZodParsingError";
}