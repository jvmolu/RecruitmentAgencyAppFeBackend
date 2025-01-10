// import { InterviewRepository } from "../repositories/interview-repository";
// import {
// 	InterviewType,
// 	InterviewWithRelatedData,
// } from "../types/zod/interview-entity";
// import {
// 	GeneralAppResponse,
// 	isGeneralAppFailureResponse,
// } from "../types/response/general-app-response";
// import { Transactional } from "../decorators/transactional";
// import HttpStatusCode from "../types/enums/http-status-codes";
// import axios from "axios";
// import { PoolClient } from "pg";
// import {
// 	AIFollowUpResponse,
// 	AIQuestion,
// } from "../types/response/ai-service-response";
// import { GeneralAppError } from "../types/error/general-app-error";

// export class InterviewService {

// 	private static interviewRepository = new InterviewRepository();

// 	@Transactional()
// 	public static async startInterview(interviewData: Omit<InterviewType, "id" | "createdAt" | "updatedAt">,client?: PoolClient): Promise<GeneralAppResponse<InterviewWithRelatedData>> {
// 		try {

// 		} catch (error) {
// 			console.error("Interview creation error:", error);
// 			return {
// 				success: false,
// 				error: error as GeneralAppError,
// 				businessMessage: "Error starting interview",
// 				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
// 			};
// 		}
// 	}

// 	public static async generateQuestion(
// 		questionText: string,
// 		answerText: string,
// 		interviewId: string
// 	): Promise<GeneralAppResponse<AIQuestion>> {
// 		try {
// 			const interview = await this.interviewRepository.findOne(interviewId);
// 			if (!interview?.success) {
// 				return {
// 					success: false,
// 					error: new Error("Interview not found") as GeneralAppError,
// 					businessMessage: "Interview not found",
// 					statusCode: HttpStatusCode.NOT_FOUND,
// 				};
// 			}

// 			try {
// 				const aiResponse = await axios.post<AIFollowUpResponse>(
// 					`${this.AI_SERVICE_URL}/generate-follow-up`,
// 					{
// 						original_question: questionText,
// 						provided_answer: answerText,
// 					}
// 				);

// 				if (!aiResponse.data?.question) {
// 					return {
// 						success: false,
// 						error: new Error("Invalid AI service response") as GeneralAppError,
// 						businessMessage: "AI service returned invalid data",
// 						statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
// 					};
// 				}

// 				const maxSeqResult =
// 					await this.interviewRepository.getMaxSequenceNumber(interviewId);

// 				if (isGeneralAppFailureResponse(maxSeqResult)) {
// 					return {
// 						success: false,
// 						error: maxSeqResult.error,
// 						businessMessage: "Failed to get sequence number",
// 						statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
// 					};
// 				}

// 				const nextSequence = (maxSeqResult.data?.max || 0) + 1;

// 				const questionData = {
// 					interviewId,
// 					questionText: aiResponse.data.question,
// 					estimatedTimeMinutes: aiResponse.data.estimated_time_minutes,
// 					sequenceNumber: nextSequence,
// 					isAiGenerated: true,
// 				};

// 				const saveResult =
// 					await this.interviewRepository.createInterviewQuestion(questionData);
// 				if (isGeneralAppFailureResponse(saveResult)) {
// 					return {
// 						success: false,
// 						error: saveResult.error,
// 						businessMessage: "Failed to save question",
// 						statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
// 					};
// 				}

// 				console.log("Saving question:", {
// 					interviewId,
// 					questionText: aiResponse.data.question,
// 					estimatedTimeMinutes: aiResponse.data.estimated_time_minutes,
// 					sequenceNumber: nextSequence,
// 					isAiGenerated: true,
// 				});
// 				return {
// 					success: true,
// 					data: {
// 						question: aiResponse.data.question,
// 						estimated_time_minutes: aiResponse.data.estimated_time_minutes,
// 					},
// 				};
// 			} catch (aiError) {
// 				console.error("AI service error:", aiError);
// 				return {
// 					success: false,
// 					error: aiError as GeneralAppError,
// 					businessMessage: "AI service error",
// 					statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
// 				};
// 			}
// 		} catch (error) {
// 			console.error("Generate question error:", error);
// 			return {
// 				success: false,
// 				error: error as GeneralAppError,
// 				businessMessage: "Failed to generate question",
// 				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
// 			};
// 		}
// 	}
// }
