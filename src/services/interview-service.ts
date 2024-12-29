import { InterviewRepository } from "../repositories/interview-repository";
import {
	InterviewQuestionType,
	InterviewStatus,
	InterviewType,
} from "../types/zod/interview-entity";
import {
	GeneralAppResponse,
	isGeneralAppFailureResponse,
} from "../types/response/general-app-response";
import { Transactional } from "../decorators/transactional";
import HttpStatusCode from "../types/enums/http-status-codes";
import axios from "axios";
import { PoolClient } from "pg";
import { AIServiceResponse } from "../types/response/ai-service-response";
import { GeneralAppError } from "../types/error/general-app-error";

export class InterviewService {
	private static interviewRepository = new InterviewRepository();
	private static AI_SERVICE_URL =
		process.env.AI_SERVICE_URL || "http://localhost:8000";

	@Transactional()
	public static async startInterview(
		candidateId: string,
		jobId: string,
		cvData: string,
		jobDescription: string,
		client?: PoolClient
	): Promise<
		GeneralAppResponse<InterviewType & { questions: InterviewQuestionType[] }>
	> {
		try {
			const interview = await this.interviewRepository.createInterview(
				{
					candidateId,
					jobId,
					status: InterviewStatus.PENDING,
				},
				client
			);

			if (isGeneralAppFailureResponse(interview)) {
				return interview;
			}

			try {
				const aiResponse = await axios.post<AIServiceResponse>(
					`${this.AI_SERVICE_URL}/generate-questions`,
					{
						cv_data: cvData,
						job_description: jobDescription,
						count: 3,
					}
				);

				if (
					!aiResponse.data?.questions ||
					!Array.isArray(aiResponse.data.questions)
				) {
					throw new Error("Invalid response from AI service");
				}

				const interviewQuestions = aiResponse.data.questions.map(
					(q, index) => ({
						interviewId: interview.data.id,
						questionText: q.question,
						sequenceNumber: index + 1,
						isAiGenerated: true,
						estimatedTimeMinutes: q.estimated_time_minutes,
					})
				);

				const questionsResult =
					await this.interviewRepository.createInterviewQuestions(
						interviewQuestions,
						client
					);

				if (isGeneralAppFailureResponse(questionsResult)) {
					return questionsResult;
				}

				return {
					success: true,
					data: {
						...interview.data,
						questions: questionsResult.data,
					},
				};
			} catch (aiError) {
				console.error("AI service error:", aiError);
				throw new Error("Failed to generate questions from AI service");
			}
		} catch (error) {
			console.error("Interview creation error:", error);
			return {
				success: false,
				error: error as GeneralAppError,
				businessMessage: "Error starting interview",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}
}
