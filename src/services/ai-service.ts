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


    public static async processResume(
        cvText: string,
        userId: string
    ): Promise<GeneralAppResponse<{ userId: string, embeddings: number[] }>> {
        try {
            
            const aiResponse = await axios.post<{ userId: string, embeddings: number[] }>(
                `${AiService.AI_SERVICE_URL}/process-resume`,
                {
                    cv_text: cvText,
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

    public static async submitJob(
        job: {title: string, objective: string, goals: string, jobDescription: string, skills: string[], experienceRequired: number},
        jobId: string
    ): Promise<GeneralAppResponse<{ jobId: string, embeddings: number[] }>> {
        try {
            
            const aiResponse = await axios.post<{ jobId: string, embeddings: number[] }>(
                `${AiService.AI_SERVICE_URL}/submit-job`,
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

    // curl --location 'http://localhost:8000/match/<jobId>?threshold=0.5&top_k=5'
    /* {
    "job_id": "job704",
    "candidates": [
        {
            "user_id": "1236",
            "resume_text": "Experienced software engineer with and know java script in depth and know nodejs golang and kubernetes",
            "similarity": 0.5845964055772352
        },
        {
            "user_id": "093",
            "resume_text": "Technical Lead 8+ years [{'skill': 'NodeJS', 'experience': '5y'}, {'skill': 'MongoDB', 'experience': '4y'}] BTech Computer Science Austin Managing cloud infrastructure",
            "similarity": 0.5670140385627908
        },
        {
            "user_id": "100101",
            "resume_text": "Technical Lead 8+ years NodeJS(5y), MongoDB(4y) [{'degree': 'BTech', 'major': 'Computer Science'}, {'degree': 'Bachelors', 'major': 'Civil Engineering', 'cgpa': '8.54'}] remote Managing cloud infrastructure",
            "similarity": 0.5608031226161905
        },
        {
            "user_id": "100106",
            "resume_text": "4 months ['C', 'C++', 'Python', 'Java', 'Javascript', 'Typescript', 'Golang', 'Django', 'NextJS', 'Express', 'React', 'NodeJs', 'Spring Boot', 'Flask', 'Neo4j', 'MongoDB', 'Azure Blob Storage', 'PostgreSQL', 'MySQL', 'Redis', 'AWS S3 Buckets', 'AWS Lambda', 'Microsoft Azure', 'Git (Version Control)', 'Docker(Containerization)', 'Solidity (Blockchain)', 'Shell', 'Google Scripts'] BTech in Computer Science and Engineering CGPA 8.58/10.0 | INTERMEDIATE / +12 CGPA 93% Meerut, India Developed multiple business-focused chatbots, significantly enhancing user engagement and experience.. Collaborated with backend teams to reduce chatbot response time to an optimized 1.2 seconds, improving responsiveness and efficiency.",
            "similarity": 0.5571725504809738
        },
        {
            "user_id": "100105",
            "resume_text": "4 months ['C', 'C++', 'Python', 'Java', 'Javascript', 'Typescript', 'Golang', 'Django', 'NextJS', 'Express', 'React', 'NodeJs', 'Spring Boot', 'Flask', 'Neo4j', 'MongoDB', 'Azure Blob Storage', 'PostgreSQL', 'MySQL', 'Redis', 'AWS S3 Buckets', 'AWS Lambda', 'Microsoft Azure', 'Git (Version Control)', 'Docker(Containerization)', 'Solidity (Blockchain)', 'Shell', 'Google Scripts'] BTech in Computer Science and Engineering CGPA 8.58/10.0 | INTERMEDIATE / +12 CGPA 93% Meerut, India Developed multiple business-focused chatbots, significantly enhancing user engagement and experience.. Collaborated with backend teams to reduce chatbot response time to an optimized 1.2 seconds, improving responsiveness and efficiency.",
            "similarity": 0.5540069075827037
        }
    ]
}*/
    // public static async getMatchesForJob()
    public static async getMatchesForJob(
        jobId: string,
        threshold: number,
        topK: number
    ): Promise<GeneralAppResponse<{ job_id: string, candidates: { user_id: string, resume_text: string, similarity: number }[] }>> {
        try {
            
            const aiResponse = await axios.get<{ job_id: string, candidates: { user_id: string, resume_text: string, similarity: number }[] }>(
                `${AiService.AI_SERVICE_URL}/match/${jobId}?threshold=${threshold}&top_k=${topK}`
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
}

export default AiService;