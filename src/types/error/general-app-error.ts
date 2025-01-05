import { AIServiceError } from "./ai-service-error";
import { AuthError } from "./auth-error";
import { BadRequestError } from "./bad-request-error";
import { DataNotFoundError } from "./data-not-found-error";
import { DatabaseError } from "./database-error";
import { EmailSendError } from "./email-send-error";
import { RedisError } from "./redis-error";
import { S3Error } from "./s3-error";
import { ZodParsingError } from "./zod-parsing-error";

// General Error Type to be used accross application
export type GeneralAppError =
	| ZodParsingError
	| DatabaseError
	| AuthError
	| DataNotFoundError
	| EmailSendError
	| RedisError
	| BadRequestError
	| S3Error
	| AIServiceError;

// Type Guard Functions
export function isDatabaseError(
	error: GeneralAppError
): error is DatabaseError {
	return (error as DatabaseError).errorType === "DatabaseError";
}

export function isZodError(error: GeneralAppError): error is ZodParsingError {
	return (error as ZodParsingError).errorType === "ZodParsingError";
}

export function isAuthError(error: GeneralAppError): error is AuthError {
	return (error as AuthError).errorType === "AuthError";
}

export function isDataNotFoundError(
	error: GeneralAppError
): error is DataNotFoundError {
	return (error as DataNotFoundError).errorType === "DataNotFoundError";
}

export function isEmailSendError(
	error: GeneralAppError
): error is EmailSendError {
	return (error as EmailSendError).errorType === "EmailSendError";
}

export function isRedisError(error: GeneralAppError): error is RedisError {
	return (error as RedisError).errorType === "RedisError";
}

export function isBadRequestError(
	error: GeneralAppError
): error is BadRequestError {
	return (error as BadRequestError).errorType === "BadRequestError";
}

export function isS3Error(error: GeneralAppError): error is S3Error {
	return (error as S3Error).errorType === "S3Error";
}

export function isAIServiceError(
	error: GeneralAppError
): error is AIServiceError {
	return (error as AIServiceError).errorType === "AIServiceError";
}
