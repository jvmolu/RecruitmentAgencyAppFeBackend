import { GeneralAppError } from "../error/general-app-error";
import { User } from "../zod/user-entity";

export type SuccessResponse<T> = {
    data: T;
    success: true;
};

export type FailureResponse = {
    error: GeneralAppError;
    businessMessage: string;
    statusCode: number;
    success: false;
};

// This type is used to return a response from the service layer to the controller layer.
// It can either return the output or an error.
// The output is the data that the service layer is supposed to return.
export type GeneralAppResponse<T> = SuccessResponse<T> | FailureResponse;

// Type Guard Functions
export function isGeneralAppResponse<T>(response: GeneralAppResponse<T>): response is SuccessResponse<T> {
    return response.success;
}

export function isGeneralAppFailureResponse<T>(response: GeneralAppResponse<T>): response is FailureResponse {
    return !response.success;
}