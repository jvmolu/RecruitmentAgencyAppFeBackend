export interface AIServiceError {
	name: string;
	message: string;
	errorType: "AIServiceError";
	stack?: string;
}

export const createAIServiceError = (message: string): AIServiceError => ({
	name: "AIServiceError",
	message,
	errorType: "AIServiceError",
});
