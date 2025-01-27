import { PoolClient } from "pg";
import { Transactional } from "../decorators/transactional";
import { InterviewRepository } from "../repositories/interview-repository";
import { InterviewSchema, InterviewSearchOptions, InterviewSearchParams, InterviewSearchParamsSchema, InterviewSearchSchema, InterviewType, InterviewWithRelatedData } from "../types/zod/interview-entity";
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
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { DataNotFoundError } from "../types/error/data-not-found-error";
import { ApplicationType } from "../types/zod/application-entity";
import { JobType } from "../types/zod/job-entity";
import { Constants } from "../common/constants";
import S3Service from "./aws-service";
import ApplicationStages from "../types/enums/application-stages";
import { ApplicationLifecycleType } from "../types/zod/application-lifecycle-entity";

dotenv.config({path: './../../.env'});

export class InterviewService {

	private static interviewRepository = new InterviewRepository();
  private static interviewQuestionRepository = new InterviewQuestionRepository();
  private static s3Service: S3Service = S3Service.getInstance();

	@Transactional()
	public static async startInterview(applicationId: string ,client?: PoolClient): Promise<GeneralAppResponse<InterviewWithRelatedData>> {
		try {

      // Check if interview already exists for this application
      const existingInterviews: GeneralAppResponse<InterviewWithRelatedData[]> = await this.findByParams({ applicationId }, {isShowQuestions: true}, client);
      if(isGeneralAppFailureResponse(existingInterviews)) {
          return existingInterviews;
      }

      const inProgressInterviews = existingInterviews.data.filter(interview => interview.status === InterviewStatus.IN_PROGRESS);
      if(inProgressInterviews.length > 0) {
          return {
              success: true,
              data: inProgressInterviews[0]
          };
      }

      // Use ApplicationService to get application data
      const applicationWithRelatedData = await ApplicationService.findByParams({id: applicationId}, {isShowLifeCycleData: true}, client);
      if(isGeneralAppFailureResponse(applicationWithRelatedData)) {
          return applicationWithRelatedData;
      }

      // Check how many AI Interviews are there in application lifecycle
      const lifecycleData = applicationWithRelatedData.data.applications[0].lifecycle;
      if(!lifecycleData) {
          return {
              success: false,
              error: new Error("Application lifecycle data not found") as GeneralAppError,
              businessMessage: "Application lifecycle data not found",
              statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
          };
      }

      const numberOfCompletedInterviews = existingInterviews.data.filter(interview => interview.status === InterviewStatus.COMPLETED).length;
      if(numberOfCompletedInterviews === 0) {

        const lifecycle: ApplicationLifecycleType = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          applicationId: applicationId,
          status: ApplicationStages.AI_INTERVIEW,
          notes: 'AI Interview Started',
        };

        // IN THIS SCENARIO ....... -> THERE IS NO AI INTERVIEW LIFECYCLE YET. CREATE ONE. (FOR FUTURE AI INTERVIEWS, AI INTERVIEW STAGE WILL ALREADY BE PRESENT AS IT WILL HAVE BEEN MOVED BY ADMIN)
        const updateStatus = await ApplicationService.updateApplications({id: applicationId}, {stage: ApplicationStages.AI_INTERVIEW}, client);
        if(isGeneralAppFailureResponse(updateStatus)) {
            return updateStatus;
        }

        lifecycleData.push(lifecycle);
      }

      const numberOfAiInterviews = lifecycleData.filter((lifecycle) => lifecycle.status === ApplicationStages.AI_INTERVIEW).length;
      if(numberOfCompletedInterviews >= numberOfAiInterviews) {
          return {
              success: false,
              error: new Error("All AI Interviews have been completed") as GeneralAppError,
              businessMessage: "All AI Interviews have been completed",
              statusCode: HttpStatusCode.FORBIDDEN
          };
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
          status: InterviewStatus.IN_PROGRESS,
          totalQuestionsToAsk: 10,
          startedAt: new Date().toISOString(),
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
      RedisService.set(`${Constants.APPLICATION_RESUME}-${applicationId}`, parsedResume, {expiresInMillis: 3600 * 1000});

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

  public static async findByParams(
    interviewFields: Partial<InterviewSearchOptions>,
    interviewSearchParams: Partial<InterviewSearchParams>,
    client?: PoolClient
  ): Promise<GeneralAppResponse<InterviewWithRelatedData[]>> {
    try {

      // Validation
      const interviewFieldsValidationResult = InterviewSearchSchema.partial().safeParse(interviewFields);
      if(!interviewFieldsValidationResult.success) {
        const zodError: ZodParsingError = interviewFieldsValidationResult.error as ZodParsingError;
        zodError.errorType = 'ZodParsingError';
        return {
            error: zodError,
            statusCode: HttpStatusCode.BAD_REQUEST,
            businessMessage: 'Invalid interview search parameters',
            success: false
        };
      }
      interviewFields = interviewFieldsValidationResult.data;

      const searchParamsValidationResult = InterviewSearchParamsSchema.safeParse(interviewSearchParams);
      if(!searchParamsValidationResult.success) {
        const zodError: ZodParsingError = searchParamsValidationResult.error as ZodParsingError;
        zodError.errorType = 'ZodParsingError';
        return {
            error: zodError,
            statusCode: HttpStatusCode.BAD_REQUEST,
            businessMessage: 'Invalid interview search parameters',
            success: false
        };
      }
      interviewSearchParams = searchParamsValidationResult.data;

      return await this.interviewRepository.findByParams(interviewFields, interviewSearchParams as InterviewSearchParams, client);
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
  
  public static async updateByParams(
    interviewSearchFields: Partial<InterviewSearchOptions>,
    interviewUpdateFields: Partial<InterviewType>,
    client?: PoolClient
  ): Promise<GeneralAppResponse<InterviewType[]>> {
    try {
      // Validation
      const searchValidationResult = InterviewSearchSchema.partial().safeParse(interviewSearchFields);
      if (!searchValidationResult.success) {
          const zodError: ZodParsingError = searchValidationResult.error as ZodParsingError;
          zodError.errorType = 'ZodParsingError';
          return {
              error: zodError,
              statusCode: HttpStatusCode.BAD_REQUEST,
              businessMessage: 'Invalid interview search parameters',
              success: false
          };
      }
      interviewSearchFields = searchValidationResult.data;

      const updateValidationResult = InterviewSchema.partial().safeParse(interviewUpdateFields);
      if (!updateValidationResult.success) {
          const zodError: ZodParsingError = updateValidationResult.error as ZodParsingError;
          zodError.errorType = 'ZodParsingError';
          return {
              error: zodError,
              statusCode: HttpStatusCode.BAD_REQUEST,
              businessMessage: 'Invalid interview update parameters',
              success: false
          };
      }
      interviewUpdateFields = updateValidationResult.data;

      return await this.interviewRepository.updateByParams(interviewSearchFields, interviewUpdateFields, client);
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

  // Grade Interview
  @Transactional()
  public static async gradeInterview(interviewId: string, client?: PoolClient): Promise<GeneralAppResponse<InterviewWithRelatedData>> {
    try {
      
        // Fetch Interview with Questions
        const existingInterview = await this.findByParams({ id: interviewId }, {isShowQuestions: true}, client);
        if(isGeneralAppFailureResponse(existingInterview)) {
            return existingInterview;
        }

        // Validate that the interviewId was correct
        if(existingInterview.data.length === 0) {
            return {
                success: false,
                businessMessage: "Interview not found",
                error: new Error("Interview not found") as GeneralAppError,
                statusCode: HttpStatusCode.NOT_FOUND
            };
        }

        // Validate that the interview is completed
        if(existingInterview.data[0].status !== InterviewStatus.COMPLETED) {
            return {
                success: false,
                businessMessage: "Interview not completed",
                error: new Error("Interview not completed") as GeneralAppError,
                statusCode: HttpStatusCode.FORBIDDEN
            };
        }

        // Fetch all questions for the interview
        const interviewQuestions = existingInterview.data[0].questions;

        if(!interviewQuestions || interviewQuestions.length === 0) {
            return {
                success: false,
                businessMessage: "Questions not found in Interview",
                error: new Error("Questions not found in Interview") as GeneralAppError,
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
            };
        }

        const questionsToPass: { id: string, question: string; answer: string }[] = interviewQuestions.map(q => {
            return {
                id: q.id,
                question: q.questionText,
                answer: q.answer || ""
            };
        });

        // Call AI Service to grade the answers
        const gradeResult: GeneralAppResponse<{ id: string, question: string; answer: string; score: number }[]> = await AiService.gradeQuestionAnswers(questionsToPass);
        if(isGeneralAppFailureResponse(gradeResult)) {
            return gradeResult;
        }

        const updates: {searchFields: Partial<InterviewQuestionType>, updateFields: Partial<InterviewQuestionType>}[] = gradeResult.data.map(q => {
            return {
              searchFields: { id: q.id },
              updateFields: { obtainedMarks: q.score, isChecked: true, updatedAt: new Date().toISOString() }
            }
        });

        // Update the questions in the DB
        const updateResult = await this.interviewQuestionRepository.updateByValues(updates, client);
        if(isGeneralAppFailureResponse(updateResult)) {
            return updateResult;
        }

        // Calculate total marks
        const totalMarks = interviewQuestions.reduce((acc, q) => acc + (q.obtainedMarks || 0), 0);

        // Update the interview with total marks
        const interviewUpdateResult = await this.updateByParams(
            { id: interviewId },
            { obtainedMarks: totalMarks, isChecked: true, updatedAt: new Date().toISOString() },
            client
        );
        if(isGeneralAppFailureResponse(interviewUpdateResult)) {
            return interviewUpdateResult;
        }

        return {
            success: true,
            data: {
                ...existingInterview.data[0],
                obtainedMarks: totalMarks,
                questions: updateResult.data
            }
        };

    } catch (error: any) {
      console.error("Error grading interview questions:", error);
      return {
        success: false,
        error,
        businessMessage: "Error grading interview questions",
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  }

  // Generate next question by calling AI Service after you have submitted the answer to the current question and returned the OK response to the user.
  // When sending the message to AI to generate a new question, reserve its sequenceNumber by saving a dummy question with the same sequenceNumber in the DB.
  // This way we will always know what the next question sequence number should be.
  @Transactional()
  public static async submitAndGenerateQuestion(
    questionId: string,
    answerText: string,
    fileUrl: string,
    client?: PoolClient
  ): Promise<GeneralAppResponse<{questions: InterviewQuestionType[], interviewStatus: InterviewStatus}>> {
    try {

      if(answerText === "") {
        answerText = "NOT ANSWERED";
      }

      // 1. Update existing question in the DB with the given answer
      const updateResult = await this.interviewQuestionRepository.updateByParams(
        { id: questionId },
        { answer: answerText, videoLink: fileUrl, updatedAt: new Date().toISOString() },
        client
      );
      if (isGeneralAppFailureResponse(updateResult)) {
        return updateResult;
      }

      // Validate that the questionId was correct
      if(updateResult.data.length === 0) {
        let dataNotFoundError: DataNotFoundError = new Error('Question not found') as DataNotFoundError;
        dataNotFoundError.errorType = 'DataNotFoundError';
        return {
          success: false,
          businessMessage: "Question not found",
          error: dataNotFoundError,
          statusCode: HttpStatusCode.NOT_FOUND
        };
      }

      // Fetch interviewId from updated question
      const interviewId = updateResult.data[0].interviewId;
  
      // 2. Generate the new question using AiService
      const existingInterview = await this.findByParams({ id: interviewId }, {isShowApplicationData: true, isShowJobData: true, isShowQuestions: true}, client);
      if(isGeneralAppFailureResponse(existingInterview)) {
        return existingInterview;
      }
      else if(existingInterview.data.length === 0) {
        return {
          success: false,
          businessMessage: "Interview not found",
          error: new Error("Interview not found") as GeneralAppError,
          statusCode: HttpStatusCode.NOT_FOUND
        };
      }

      // THIS WILL ROLLBACK THE TRANSACTION
      if(existingInterview.data[0].status !== InterviewStatus.IN_PROGRESS) {
        return {
          success: false,
          businessMessage: "Interview not in progress",
          error: new Error("Interview not in progress") as GeneralAppError,
          statusCode: HttpStatusCode.FORBIDDEN
        };
      }

      if(!existingInterview.data[0].application) {
        return {
          success: false,
          businessMessage: "Application data not found in Interview",
          error: new Error("Application data not found in Interview") as GeneralAppError,
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        };
      }

      if(!existingInterview.data[0].job) {
        return {
          success: false,
          businessMessage: "Job data not found in Interview",
          error: new Error("Job data not found in Interview") as GeneralAppError,
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        };
      }

      if(!existingInterview.data[0].questions) {
        return {
          success: false,
          businessMessage: "Questions data not found in Interview",
          error: new Error("Questions data not found in Interview") as GeneralAppError,
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        };
      }

      const existingQuestions: InterviewQuestionType[] = existingInterview.data[0].questions;
      const applicationData: Partial<ApplicationType> = existingInterview.data[0].application;
      const jobData: Partial<JobType> = existingInterview.data[0].job;
      const totalQuestionsToAsk: number = existingInterview.data[0].totalQuestionsToAsk;

      if(totalQuestionsToAsk === updateResult.data[0].sequenceNumber) {
        // CALL UPDATE BY PARAMS AND SET INTERVIEW STATUS TO COMPLETED
        const updateInterviewResult = await this.updateByParams(
          { id: interviewId },
          { status: InterviewStatus.COMPLETED, updatedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
          client
        );
        if (isGeneralAppFailureResponse(updateInterviewResult)) {
          return updateInterviewResult;
        }

        // Set Immediate to Grade Interview
        setImmediate(async () => {
          try {
            await this.gradeInterview(interviewId);
          } catch (error: any) {
            console.error("Grade Interview error:", error);
          }
        });

        return {
          success: true,
          data: {
            questions: existingQuestions,
            interviewStatus: InterviewStatus.COMPLETED
          }
        };
      }

      // Check if interview has been going on for more than 1 hour [Interview Time Limit]
      const startedAt = new Date(existingInterview.data[0].startedAt as string);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - startedAt.getTime();
      const timeDifferenceInMinutes = timeDifference / 60000;
      if(timeDifferenceInMinutes > 60) {
        // CALL UPDATE BY PARAMS AND SET INTERVIEW STATUS TO COMPLETED
        const updateInterviewResult = await this.updateByParams(
          { id: interviewId },
          { status: InterviewStatus.COMPLETED, updatedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
          client
        );
        if (isGeneralAppFailureResponse(updateInterviewResult)) {
          return updateInterviewResult;
        }
        // Set Immediate to Grade Interview
        setImmediate(async () => {
          try {
            await this.gradeInterview(interviewId);
          } catch (error: any) {
            console.error("Grade Interview error:", error);
          }
        });
        return {
          success: true,
          data: {
            questions: existingQuestions,
            interviewStatus: InterviewStatus.COMPLETED
          }
        };
      }

      // ALL QUESTIONS HAVE BEEN GENERATED AND NOW DONT GENERATE ANY MORE QUESTIONS
      if(existingQuestions.length >= totalQuestionsToAsk) {
        return {
          success: true,
          data: {
            questions: existingQuestions,
            interviewStatus: InterviewStatus.IN_PROGRESS
          }
        }
      }

      // Reserve next question's sequence number
      const nextSequenceNumber = existingQuestions.length + 1;
      const nextQuestionConfig = {
        expectedTimeToAnswer: 5,
        category: "Technical",
        totalMarks: 10,
        sequenceNumber: nextSequenceNumber
      };
      const placeholderQuestion: InterviewQuestionType = {
        id: uuidv4(),
        interviewId,
        questionText: Constants.DUMMY_QUESTION_PLACEHOLDER,
        sequenceNumber: nextSequenceNumber,
        isAiGenerated: true,
        estimatedTimeMinutes: nextQuestionConfig.expectedTimeToAnswer,
        category: nextQuestionConfig.category,
        totalMarks: nextQuestionConfig.totalMarks,
        obtainedMarks: 0,
        isChecked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Insert placeholder row to reserve sequenceNumber
      const placeholderResult = await this.interviewQuestionRepository.createInterviewQuestions([placeholderQuestion], client);
      if (isGeneralAppFailureResponse(placeholderResult)) {
        return placeholderResult;
      }

      // Return success immediately (no need to wait for AI generation)
      const responseToUser: GeneralAppResponse<{ questions: InterviewQuestionType[]; interviewStatus: InterviewStatus }> = {
        success: true,
        data: {
          questions: existingQuestions.filter(q => q.questionText !== Constants.DUMMY_QUESTION_PLACEHOLDER),
          interviewStatus: existingInterview.data[0].status,
        },
      };

      // Generate question in background & update placeholder record
      // Not using client here as it will be closed after the transaction (Here we will use the default pool client)
      // TODO. GENERATE QUESTION FOR ALL DUMMY_QUESTIONS AS WELL HERE. (Basically Retrying the AI generation for all dummy questions)
      setImmediate(async () => {
        try {
          // Fetch applicationId from the interview
          const applicationId = existingInterview.data[0].applicationId;

          // Prepare data for AI generation (dummy placeholders here)
          // Fetch Resume data from Redis
          const parsedResume = await RedisService.get(`${Constants.APPLICATION_RESUME}-${applicationId}`);
          if (isGeneralAppFailureResponse(parsedResume)) {
            // Could update placeholder question with "Couldn't generate question"
            console.error("Resume data not found in cache:", parsedResume);
            return;
          }

          // If resume data is not found in cache, return error response
          // We should ideally end the interview here.
          // TTL for parsed resume should be same as the interview time limit + buffer
          if(parsedResume.data === null) {

            // Set Immediate to Grade Interview
            await this.gradeInterview(interviewId);

            // Update interview status to completed
            const updateInterviewResult = await this.updateByParams(
              { id: interviewId },
              { status: InterviewStatus.COMPLETED, updatedAt: new Date().toISOString() },
              client
            );

            return;
          }

          const skillDescriptionMap: Record<string, string> = applicationData.skillDescriptionMap || {};

          const jobDataToPass = {
            title: jobData.title || "",
            objective: jobData.objective || "",
            goals: jobData.goals || "",
            jobDescription: jobData.jobDescription || "",
            skills: jobData.skills || [],
            experienceRequired: jobData.experienceRequired || 0
          };

          const previousQuestionAnswerPairs: { question: string, answer: string }[] = existingQuestions.filter(q =>  
            q.questionText !== Constants.DUMMY_QUESTION_PLACEHOLDER &&
            q.answer &&
            q.answer.length > 0
          ).map(q => {
            return { question: q.questionText, answer: q.answer as string };
          });

          const aiQuestionResponse = await AiService.generateInterviewQuestions(
            parsedResume.data,
            skillDescriptionMap,
            jobDataToPass,
            previousQuestionAnswerPairs,
            [ nextQuestionConfig ]
          );
          if (isGeneralAppFailureResponse(aiQuestionResponse)) {
            // Could update placeholder question with "Couldn't generate question"
            console.error("AI question generation failed:", aiQuestionResponse);
            return;
          }
    
          // Update placeholder with actual AI question
          const realQuestion: AIQuestion = aiQuestionResponse.data[0];
          await this.interviewQuestionRepository.updateByParams(
            { id: placeholderQuestion.id },
            { questionText: realQuestion.question, updatedAt: new Date().toISOString() }
          );
    
          return;
        }
        catch (error: any) {
          console.error("Submit & generate question error:", error);
          return;
       }
      });

      return responseToUser;
    } catch (error: any) {
      console.error("Submit & generate question error:", error);
      return {
        success: false,
        error,
        businessMessage: "Error submitting answer and generating new question",
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  /**
	 * @method uploadQuestionRecording
	 * @description Handles the upload of a resume file to DigitalOcean Spaces.
	 * @param file - The file to be uploaded.
	 * @param bucketName - The name of the bucket to upload the file to.
	 * @param questionId - The identifier for the question.
	 * @returns Promise resolving to a GeneralAppResponse containing the file URL or an error.
	 **/
	public static async uploadQuestionRecording(
		bucketName: string,
		questionId: string,
		file: Express.Multer.File
	): Promise<GeneralAppResponse<string>> {

		const fileUrl: string = `/question/${questionId}/recording/video.mp4`;
		const uploadResult: GeneralAppResponse<void> = await this.s3Service.uploadFile(bucketName, fileUrl, file.buffer);

		if (isGeneralAppFailureResponse(uploadResult)) {
			return {
				success: false,
				businessMessage: uploadResult.businessMessage,
				error: uploadResult.error,
				statusCode: uploadResult.statusCode,
			};
		}

		return {
			success: true,
			data: fileUrl,
		};
	}

}
