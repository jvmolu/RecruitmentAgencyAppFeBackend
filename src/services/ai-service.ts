import axios from "axios";
import HttpStatusCode from "../types/enums/http-status-codes";
import { AIServiceError } from "../types/error/ai-service-error";
import { AIEvaluationResponse, AIQuestion, AIGenerateQuestionResponse, AIGenerateQuestionResponseZodSchema, AIEvaluationResponseZodSchema } from "../types/response/ai-service-response";
import { GeneralAppResponse } from "../types/response/general-app-response";

class AiService {

    private static AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    static async generateInterviewQuestions(
        cvParsedData: string,
        skillDescriptionMap: { [key: string]: string },
        job: {title: string, objective: string, goals: string, jobDescription: string, skills: string[], experienceRequired: number},
        previousQuestions: { question: string; answer: string }[],
        expectedQuestionsConfig: { 
            expectedTimeToAnswer: number,
            category: string
        }[]
    ) : Promise<GeneralAppResponse<AIQuestion[]>> {

        try {

            const aiResponse = await axios.post<AIGenerateQuestionResponse>(
                `${AiService.AI_SERVICE_URL}/generate-questions`,
                {
                    cv_data: cvParsedData,
                    skill_description_map: skillDescriptionMap,
                    job_data: job,
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
        cvData: string,
        skillDescriptionMap?: { [key: string]: string }
	): Promise<GeneralAppResponse<AIEvaluationResponse>> {
		try {
			
            const aiResponse = await axios.post<AIEvaluationResponse>(
                `${AiService.AI_SERVICE_URL}/analyze-match`,
                {
                    job,
                    cv_data: cvData,
                    skill_description_map: skillDescriptionMap || {}
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

  
    public static async gradeQuestionAnswers(
        questionAnswerPairs: { id: string, question: string; answer: string }[]
    ): Promise<GeneralAppResponse<{ id: string, question: string; answer: string; score: number }[]>> {
        try {
            
            const aiResponse = await axios.post<{ id: string, question: string; answer: string; score: number }[]>(
                `${AiService.AI_SERVICE_URL}/score-answers`,
                {
                    questionAnswerPairs
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

            if (!aiResponseData) {
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


    public static async generateProfileEmbedding(
        cvText: string,
        userId: string
    ): Promise<GeneralAppResponse<{ userId: string, embedding: number[] }>> {
        try {
            
            const aiResponse = await axios.post<{ userId: string, embedding: number[] }>(
                `${AiService.AI_SERVICE_URL}/process-resume`,
                {
                    cvText,
                    userId
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

            if (!aiResponseData || !aiResponseData.userId || !aiResponseData.embedding || aiResponseData.embedding.length === 0) {
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


    public static async generateJobEmbedding(
        job: {title: string, objective: string, goals: string, jobDescription: string, skills: string[], experienceRequired: number},
        jobId: string
    ): Promise<GeneralAppResponse<{ jobId: string, embedding: number[] }>> {
        try {
            
            const aiResponse = await axios.post<{ jobId: string, embedding: number[] }>(
                `${AiService.AI_SERVICE_URL}/process-jd`,
                {
                    job,
                    jobId
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

            if (!aiResponseData) {
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


    public static async getMatchesForJob(
        jobId: string,
        threshold: number
    ): Promise<GeneralAppResponse<{ jobId: string, candidates: { userId: string, resumeText: string, similarity: number }[] }>> {
        try {
            
            const aiResponse = await axios.get<{ jobId: string, candidates: { userId: string, resumeText: string, similarity: number }[] }>(
                `${AiService.AI_SERVICE_URL}/match/${jobId}?threshold=${threshold}`
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

            if (!aiResponseData || !aiResponseData.jobId || !aiResponseData.candidates) {
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