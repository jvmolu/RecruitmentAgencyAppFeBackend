import { GeneralAppResponse } from "../types/response/general-app-response";
import { AIEvaluationResponse } from "../types/response/ai-service-response";
import { createAIServiceError } from "../types/error/ai-service-error";
import HttpStatusCode from "../types/enums/http-status-codes";

export interface AnalysisRequestData {
	jobDescription: {
		title: string;
		description?: string;
		skills?: string[];
		experienceRequired: string | number;
	};
	candidateProfile: {
		skills: any;
		experience: any;
		resumeUrl: string;
		noticePeriod: number;
		expectedSalary: number;
	};
}

export class AIEvaluateService {
	private static AI_SERVICE_URL = process.env.AI_SERVICE_URL;

	public static async evaluateMatch(
		analysisData: AnalysisRequestData
	): Promise<GeneralAppResponse<AIEvaluationResponse>> {
		try {
			const aiResponse = await fetch(`${this.AI_SERVICE_URL}/analyze-match`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(analysisData),
			});

			if (!aiResponse.ok) {
				throw createAIServiceError(
					"Failed to get match analysis from AI backend"
				);
			}

			const matchAnalysis = await aiResponse.json();

			if (
				!matchAnalysis.overallMatch ||
				!Array.isArray(matchAnalysis.requirements)
			) {
				throw createAIServiceError("Invalid response format from AI service");
			}

			return {
				success: true,
				data: matchAnalysis,
			};
		} catch (error) {
			return {
				success: false,
				error: createAIServiceError(
					error instanceof Error ? error.message : "Unknown error"
				),
				businessMessage: "Failed to evaluate match with AI",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}
}
