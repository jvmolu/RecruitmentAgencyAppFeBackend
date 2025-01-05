import { Request, Response } from "express";
import { ApplicationService } from "../services/application-service";
import {
	GeneralAppResponse,
	isGeneralAppFailureResponse,
} from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import {
	ApplicationType,
	ApplicationWithRelatedData,
} from "../types/zod/application-entity";
import { v4 as uuidv4 } from "uuid";
import { JobService } from "../services/job-service";
import {
	AIEvaluateService,
	AnalysisRequestData,
} from "../services/ai-evaluate-service";
import { InviteType } from "../types/zod/invite-entity";

export class ApplicationController {
	public static async createApplication(
		req: Request,
		res: Response
	): Promise<any> {
		try {
			// Check if application exists already..
			const candidateId = req.body.candidateId;
			const jobId = req.body.jobId;

			if (!candidateId || !jobId) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message: "Invalid request body - candidateId and jobId are required",
				});
			}

			const existingApplication: GeneralAppResponse<{
				applications: ApplicationWithRelatedData[];
				pendingInvites: InviteType[];
			}> = await ApplicationService.findByParams({ candidateId, jobId }, {});
			if (isGeneralAppFailureResponse(existingApplication)) {
				return res.status(existingApplication.statusCode).json({
					success: false,
					message: existingApplication.businessMessage,
					error: existingApplication.error,
				});
			}

			if (existingApplication.data.applications.length > 0) {
				return res.status(HttpStatusCode.CONFLICT).json({
					success: false,
					message: "Application already exists for this candidate and job",
				});
			}

			// Create a uuid
			const applicationId: string = uuidv4();
			const file: Express.Multer.File = req.file as Express.Multer.File;
			const bucketName: string | undefined =
				process.env.DIGITAL_OCEAN_BUCKET_NAME;
			if (!bucketName) {
				return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
					success: false,
					message: "Internal server error",
					error: "Bucket name not found in environment variables",
				});
			}

			const fileUploadResult: GeneralAppResponse<string> =
				await ApplicationService.uploadResume(bucketName, applicationId, file);
			if (isGeneralAppFailureResponse(fileUploadResult)) {
				return res.status(fileUploadResult.statusCode).json({
					success: false,
					message: fileUploadResult.businessMessage,
					error: fileUploadResult.error,
				});
			}

			// Attach the id and resume link to the application data
			req.body.id = applicationId;
			req.body.resumeLink = fileUploadResult.data;

			const result: GeneralAppResponse<ApplicationType> =
				await ApplicationService.createApplication(req.body);
			if (isGeneralAppFailureResponse(result)) {
				return res.status(result.statusCode).json({
					success: false,
					message: result.businessMessage,
					error: result.error,
				});
			}
			return res.status(HttpStatusCode.CREATED).json(result);
		} catch (error) {
			console.error(error);
			return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: "Internal server error",
				error,
			});
		}
	}

	public static async findByParams(req: Request, res: Response): Promise<any> {
		try {
			const result: GeneralAppResponse<{
				applications: ApplicationWithRelatedData[];
				pendingInvites: InviteType[];
			}> = await ApplicationService.findByParams(req.body, req.query);
			if (isGeneralAppFailureResponse(result)) {
				return res.status(result.statusCode).json({
					success: false,
					message: result.businessMessage,
					error: result.error,
				});
			}
			return res.status(HttpStatusCode.OK).json(result);
		} catch (error) {
			console.error(error);
			return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: "Internal server error",
				error,
			});
		}
	}

	public static async getRequirementsMatch(
		req: Request,
		res: Response
	): Promise<any> {
		try {
			const jobId = req.params.jobId;
			const { applicationId, candidateData } = req.body;

			if (!jobId || !applicationId || !candidateData) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message:
						"Missing required parameters - jobId, applicationId and candidateData are required",
				});
			}

			const jobResponse = await JobService.findByParams({ id: jobId }, {});
			if (
				isGeneralAppFailureResponse(jobResponse) ||
				!jobResponse.data.length
			) {
				return res.status(HttpStatusCode.NOT_FOUND).json({
					success: false,
					message: "Job not found",
				});
			}

			const applicationResponse = await ApplicationService.findByParams(
				{ id: applicationId },
				{}
			);
			if (
				isGeneralAppFailureResponse(applicationResponse) ||
				!applicationResponse.data.applications.length
			) {
				return res.status(HttpStatusCode.NOT_FOUND).json({
					success: false,
					message: "Application not found",
				});
			}

			const jobDetails = jobResponse.data[0];
			const application = applicationResponse.data.applications[0];

			const analysisData: AnalysisRequestData = {
				jobDescription: {
					title: jobDetails.title || "",
					description: jobDetails.jobDescription || "",
					skills: jobDetails.skills || [],
					experienceRequired: jobDetails.experienceRequired || 0,
				},
				candidateProfile: {
					skills: candidateData.skills,
					experience: candidateData.experience,
					resumeUrl: application.resumeLink,
					noticePeriod: Number(candidateData.noticePeriod) || 0,
					expectedSalary: Number(candidateData.expectedSalary) || 0,
				},
			};

			if (
				!analysisData.jobDescription.title ||
				!analysisData.candidateProfile.resumeUrl
			) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message: "Missing required fields for analysis",
				});
			}

			const aiEvaluation = await AIEvaluateService.evaluateMatch(analysisData);

			if (!aiEvaluation.success) {
				return res.status(aiEvaluation.statusCode).json({
					success: false,
					message: aiEvaluation.businessMessage,
					error: aiEvaluation.error,
				});
			}

			return res.status(HttpStatusCode.OK).json({
				success: true,
				data: aiEvaluation.data,
			});
		} catch (error) {
			console.error("Requirements match analysis error:", error);
			return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: "Failed to analyze requirements match",
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	public static async updateApplications(
		req: Request,
		res: Response
	): Promise<any> {
		try {
			if (!req.body.searchParams || !req.body.updateParams) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message:
						"Invalid request body - searchParams and updateParams are required",
				});
			}

			// Upload the resume if it exists
			if (req.file) {
				if (!req.body.searchParams.id) {
					return res.status(HttpStatusCode.BAD_REQUEST).json({
						success: false,
						message: "Invalid request body - searchParams must contain an id.",
					});
				}

				// Upload the file
				const file: Express.Multer.File = req.file as Express.Multer.File;
				const bucketName: string | undefined =
					process.env.DIGITAL_OCEAN_BUCKET_NAME;
				if (!bucketName) {
					return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
						success: false,
						message: "Internal server error",
						error: "Bucket name not found in environment variables",
					});
				}

				const fileUploadResult: GeneralAppResponse<string> =
					await ApplicationService.uploadResume(
						bucketName,
						req.body.searchParams.id,
						file
					);
				if (isGeneralAppFailureResponse(fileUploadResult)) {
					return res.status(fileUploadResult.statusCode).json({
						success: false,
						message: fileUploadResult.businessMessage,
						error: fileUploadResult.error,
					});
				}

				req.body.updateParams.resumeLink = fileUploadResult.data;
			}

			const result: GeneralAppResponse<ApplicationType[]> =
				await ApplicationService.updateApplications(
					req.body.searchParams,
					req.body.updateParams
				);
			if (isGeneralAppFailureResponse(result)) {
				return res.status(result.statusCode).json({
					success: false,
					message: result.businessMessage,
					error: result.error,
				});
			}
			return res.status(HttpStatusCode.OK).json(result);
		} catch (error) {
			console.error(error);
			return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: "Internal server error",
				error,
			});
		}
	}
}
