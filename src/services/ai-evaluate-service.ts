import { GeneralAppResponse } from "../types/response/general-app-response";
import { AIEvaluationResponse } from "../types/response/ai-service-response";
import { createAIServiceError } from "../types/error/ai-service-error";
import HttpStatusCode from "../types/enums/http-status-codes";

export class AIEvaluateService {
	private static AI_SERVICE_URL = process.env.AI_SERVICE_URL;

	public static async evaluateMatch(
		analysisData: any
	): Promise<GeneralAppResponse<AIEvaluationResponse>> {
		try {
			const aiResponse = await fetch(`${this.AI_SERVICE_URL}/analyze-match`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(analysisData),
			});

			if (!aiResponse.ok) {
				throw createAIServiceError(
					"Failed to get match analysis from AI backend"
				);
			}

			const matchAnalysis = await aiResponse.json();
			return {
				success: true,
				data: matchAnalysis,
			};
		} catch (error) {
			const aiError =
				error instanceof Error
					? createAIServiceError(error.message)
					: createAIServiceError("Unknown AI service error");

			return {
				success: false,
				error: aiError,
				businessMessage: "Failed to evaluate match with AI",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}
}
