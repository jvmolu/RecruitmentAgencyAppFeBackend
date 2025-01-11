import HttpStatusCode from "../types/enums/http-status-codes";
import { AIServiceError } from "../types/error/ai-service-error";
import { AIEvaluationResponse, AIQuestion, AIGenerateQuestionResponse, AIGenerateQuestionResponseZodSchema, AIEvaluationResponseZodSchema } from "../types/response/ai-service-response";
import { GeneralAppResponse } from "../types/response/general-app-response";
import { UserProfileWithRelatedData } from "../types/zod/user-profile-entity";

class AiService {

    private static AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    static async generateInterviewQuestions(
        cvParsedData: string,
        jobDescription: string,
        previousQuestions: { question: string; answer: string }[],
        expectedQuestionsConfig: [{ 
            question: string,
            expectedTimeToAnswer: number,
            category: string
        }]
    ) : Promise<GeneralAppResponse<AIQuestion[]>> {

        try {

            const aiResponse = await axios.post<AIGenerateQuestionResponse>(
                `${AiService.AI_SERVICE_URL}/generate-questions`,
                {
                    cv_data: cvParsedData,
                    job_description: jobDescription,
                    previous_questions: previousQuestions,
                    expected_questions_config: expectedQuestionsConfig
                }
            );
            
            // If response has status code other than 200
            if (aiResponse.status !== HttpStatusCode.OK) {
                let aiResponseError: AIServiceError = new Error("AI Service Failed") as AIServiceError;
                aiResponseError.errorType = "AIServiceError";
                return {
                    error: aiResponseError,
                    statusCode: aiResponse.status,
                    businessMessage: "AI Service Returned an Error",
                    success: false,
                };
            }

            let aiResponseData = aiResponse.data;

            // If for any question, the question is missing or expected time to answer is missing
            if (
                !aiResponseData || 
                !aiResponseData.questions ||
                aiResponseData.questions.length !== expectedQuestionsConfig.length ||
                AIGenerateQuestionResponseZodSchema.safeParse(aiResponseData).success === false
            ) {
                let aiResponseError: AIServiceError = new Error("Invalid Response from AI Service") as AIServiceError;
                aiResponseError.errorType = "AIServiceError";
                return {
                    error: aiResponseError,
                    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    businessMessage: "Invalid Response from AI Service",
                    success: false,
                };
            }
    
            return {
                data: aiResponseData.questions,
                success: true
            };
        }
        catch (error: any) {
            return {
                error,
                businessMessage: 'Internal Server Error',
                success: false,
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
            };
        }
    }


    public static async evaluateMatch(
        job: {title: string, objective: string, goals: string, jobDescription: string, skills: string[], experienceRequired: number},
        userProfile: UserProfileWithRelatedData,
        skillDescriptionMap: { [key: string]: string }
	): Promise<GeneralAppResponse<AIEvaluationResponse>> {
		try {
			
            const aiResponse = await axios.post<AIEvaluationResponse>(
                `${AiService.AI_SERVICE_URL}/analyze-match`,
                {
                    job,
                    userProfile,
                    skillDescriptionMap
                }
            );

            // If response has status code other than 200
            if (aiResponse.status !== HttpStatusCode.OK) {
                let aiResponseError: AIServiceError = new Error("AI Service Failed") as AIServiceError;
                aiResponseError.errorType = "AIServiceError";
                return {
                    error: aiResponseError,
                    statusCode: aiResponse.status,
                    businessMessage: "AI Service Returned an Error",
                    success: false,
                };
            }

            let aiResponseData = aiResponse.data;
            if (
                !aiResponseData || 
                AIEvaluationResponseZodSchema.safeParse(aiResponseData).success === false
            ) {
                let aiResponseError: AIServiceError = new Error("Invalid Response from AI Service") as AIServiceError;
                aiResponseError.errorType = "AIServiceError";
                return {
                    error: aiResponseError,
                    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    businessMessage: "Invalid Response from AI Service",
                    success: false,
                };
            }

            return {
                data: aiResponseData,
                success: true
            };
        }
        catch (error: any) {
            return {
                error,
                businessMessage: 'Internal Server Error',
                success: false,
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
            };
        }
	}

}

export default AiService;
