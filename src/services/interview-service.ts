import { PoolClient } from "pg";
import { Transactional } from "../decorators/transactional";
import { InterviewRepository } from "../repositories/interview-repository";
import { InterviewType, InterviewWithRelatedData } from "../types/zod/interview-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import { v4 as uuidv4 } from "uuid";
import InterviewStatus from "../types/enums/interview-status";
import { ApplicationService } from "./application-service";
import AiService from "./ai-service";
import { UserProfileService } from "./user-profile-service";
import dotenv from 'dotenv';
import { GeneralAppError } from "../types/error/general-app-error";
import { extractTextFromPDF } from "../common/pdf-util";
import RedisService from "./redis-service";
import { AIQuestion } from "../types/response/ai-service-response";
import { InterviewQuestionRepository } from "../repositories/interview-question-repository";
import { InterviewQuestionType } from "../types/zod/interview-question";

dotenv.config({path: './../../.env'});

export class InterviewService {

	private static interviewRepository = new InterviewRepository();
    private static interviewQuestionRepository = new InterviewQuestionRepository();

	@Transactional()
	public static async startInterview(applicationId: string ,client?: PoolClient): Promise<GeneralAppResponse<InterviewWithRelatedData>> {
		try {

            // Use ApplicationService to get application data
            const applicationWithRelatedData = await ApplicationService.findByParams({id: applicationId}, {isShowLifeCycleData: false}, client);
            if(isGeneralAppFailureResponse(applicationWithRelatedData)) {
                return applicationWithRelatedData;
            }

            if(applicationWithRelatedData.data.applications.length === 0 || !applicationWithRelatedData.data.applications[0].job) {
                return {
                    success: false,
                    error: new Error("Application not found with job data") as GeneralAppError,
                    businessMessage: "Application not found with job data",
                    statusCode: HttpStatusCode.NOT_FOUND
                };
            }

            const interviewData: InterviewType = {
                id: uuidv4(),
                jobId: applicationWithRelatedData.data.applications[0].jobId,
                candidateId: applicationWithRelatedData.data.applications[0].candidateId,
                applicationId: applicationId,
                totalMarks: 100,
                obtainedMarks: 0,
                isChecked: false,
                status: InterviewStatus.PENDING,
                totalQuestionsToAsk: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save interview data
            const interviewResult = await this.interviewRepository.createInterview(interviewData, client);
            if(isGeneralAppFailureResponse(interviewResult)) {
                return interviewResult;
            }

            // Parse the Resume and store it in redis for 1 hour
            if(!process.env.DIGITAL_OCEAN_BUCKET_NAME) {
                return {
                    success: false,
                    error: new Error("Bucket name not found in environment variables") as GeneralAppError,
                    businessMessage: "Bucket name not found in environment variables",
                    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
                };
            }

            const resumeFile = await UserProfileService.downloadFile(process.env.DIGITAL_OCEAN_BUCKET_NAME, applicationWithRelatedData.data.applications[0].resumeLink);
            if(isGeneralAppFailureResponse(resumeFile)) {
                return resumeFile;
            }

            const parsedResume = await extractTextFromPDF(resumeFile.data);

            // Store in redis for 1 hour
            RedisService.set(`application-resume-${applicationId}`, parsedResume, {expiresInMillis: 3600 * 1000});

            const jobDataToPass = {
                title: applicationWithRelatedData.data.applications[0].job.title || "",
                objective: applicationWithRelatedData.data.applications[0].job.objective || "",
                goals: applicationWithRelatedData.data.applications[0].job.goals || "",
                jobDescription: applicationWithRelatedData.data.applications[0].job.jobDescription || "",
                skills: applicationWithRelatedData.data.applications[0].job.skills || [],
                experienceRequired: applicationWithRelatedData.data.applications[0].job.experienceRequired || 0
            };

            const dummyConfig = {
                expectedTimeToAnswer: 5,
                category: "Technical",
                totalMarks: 10
            }

            const questionsConfig = Array.from({length: 3}, () => dummyConfig);

            const questions: GeneralAppResponse<AIQuestion[]> = await AiService.generateInterviewQuestions(
                parsedResume,
                applicationWithRelatedData.data.applications[0].skillDescriptionMap,
                jobDataToPass,
                [],
                questionsConfig
            );

            if(isGeneralAppFailureResponse(questions)) {
                return questions;
            }

            const interviewQuestionsDb: InterviewQuestionType[] = questions.data.map((question, index) => {
                return {
                    id: uuidv4(),
                    interviewId: interviewData.id,
                    totalMarks: questionsConfig[index].totalMarks,
                    obtainedMarks: 0,
                    isChecked: false,
                    questionText: question.question,
                    sequenceNumber: index + 1,
                    isAiGenerated: true,
                    estimatedTimeMinutes: questionsConfig[index].expectedTimeToAnswer,
                    category: questionsConfig[index].category,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });

            // Save the questions in the database
            const interviewQuesRes = await this.interviewQuestionRepository.createInterviewQuestions(interviewQuestionsDb, client);
            if(isGeneralAppFailureResponse(interviewQuesRes)) {
                return interviewQuesRes;
            }

            return {
                success: true,
                data: {
                    ...interviewData,
                    questions: interviewQuestionsDb
                }
            };

		} catch (error: any) {
			console.error("Interview creation error:", error);
			return {
				success: false,
				error: error,
				businessMessage: "Error starting interview",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}

    public static async findByParams(interviewFields: Partial<InterviewType>,client?: PoolClient): Promise<GeneralAppResponse<InterviewType[]>> {
        try {
            const result = await this.interviewRepository.findByParams(interviewFields, client);
            if(isGeneralAppFailureResponse(result)) {
                return result;
            }
            return {
                success: true,
                data: result.data
            };
        }
        catch (error: any) {
            console.error("Error finding interview:", error);
            return {
                success: false,
                error,
                businessMessage: "Error finding interview",
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
            };
        }
    }
    
    public static async updateByParams(interviewSearchFields: Partial<InterviewType>, interviewUpdateFields: Partial<InterviewType>,client?: PoolClient): Promise<GeneralAppResponse<InterviewType[]>> {
        try {
            const result = await this.interviewRepository.updateByParams(interviewSearchFields, interviewUpdateFields, client);
            if(isGeneralAppFailureResponse(result)) {
                return result;
            }
            return {
                success: true,
                data: result.data
            };
        }
        catch (error: any) {
            console.error("Error updating interview:", error);
            return {
                success: false,
                error,
                businessMessage: "Error updating interview",
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
            };
        }
    }

    // TODO. Complete this: Right now it is just a skeleton generated by copilot
    // Method to Submit a question and generate the next question and save it in the database
    @Transactional()
    public static async submitAndGenerateQuestion(
      questionId: string,
      answerText: string,
      interviewId: string,
      nextQuestionConfig: { expectedTimeToAnswer: number; category: string },
      client?: PoolClient
    ): Promise<GeneralAppResponse<InterviewQuestionType[]>> {
      try {
        // 1. Update existing question in the DB with the given answer
        const updateResult = await this.interviewQuestionRepository.updateByParams(
          { id: questionId, interviewId },
          { answer: answerText, updatedAt: new Date().toISOString() },
          client
        );
        if (isGeneralAppFailureResponse(updateResult)) {
          return updateResult;
        }
    
        // 2. Generate the new question using AiService
        const existingInterview = await this.findByParams({ id: interviewId }, client);
        if (isGeneralAppFailureResponse(existingInterview) || !existingInterview.data.length) {
          return {
            success: false,
            businessMessage: "Interview not found",
            error: new Error("Interview not found") as GeneralAppError,
            statusCode: HttpStatusCode.NOT_FOUND
          };
        }
    
        // Prepare data for AI generation (dummy placeholders here)
        // You can fetch resume data from Redis or other sources as needed:
        const dummyResumeData = "Resume content here";
        const skillDescriptionMap = {}; // e.g., from job or candidate data
        const jobData = {
          title: "Software Engineer",
          objective: "",
          goals: "",
          jobDescription: "",
          skills: [],
          experienceRequired: 0
        };
    
        const aiQuestionResponse = await AiService.generateInterviewQuestions(
          dummyResumeData,
          skillDescriptionMap,
          jobData,
          [{ question: "Dummy Q", answer: answerText }],
          [ nextQuestionConfig ]
        );
        if (isGeneralAppFailureResponse(aiQuestionResponse)) {
          return aiQuestionResponse;
        }
    
        const newQuestions = aiQuestionResponse.data.map((q, index) => {
          return <InterviewQuestionType>{
            id: uuidv4(),
            interviewId,
            questionText: q.question,
            sequenceNumber: Date.now(), // or however you generate the next sequence
            isAiGenerated: true,
            estimatedTimeMinutes: nextQuestionConfig.expectedTimeToAnswer,
            category: nextQuestionConfig.category,
            totalMarks: 10,
            obtainedMarks: 0,
            isChecked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
    
        // 3. Insert new question(s) in the DB
        const insertNewQuestionResult =
          await this.interviewQuestionRepository.createInterviewQuestions(newQuestions, client);
        if (isGeneralAppFailureResponse(insertNewQuestionResult)) {
          return insertNewQuestionResult;
        }
    
        // Return all updated & newly created questions
        const combinedQuestions = [...(updateResult.data || []), ...(insertNewQuestionResult.data || [])];
        return {
          success: true,
          data: combinedQuestions
        };
      } catch (error: any) {
        console.error("Submit & generate question error:", error);
        return {
          success: false,
          error,
          businessMessage: "Error submitting answer and generating new question",
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        };
      }
    }

}
