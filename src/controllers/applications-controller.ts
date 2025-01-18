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
import { InviteType } from "../types/zod/invite-entity";
import Role from "../types/enums/role";
import dotenv from 'dotenv';
import { AIEvaluationResponse } from "../types/response/ai-service-response";

dotenv.config({path: './../../.env'});

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

			if(!req.body.matchReport) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message: "Invalid request body - matchReport is required",
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

			const matchReport = req.body.matchReport;
			delete req.body.matchReport;

			const result: GeneralAppResponse<ApplicationType> = await ApplicationService.createApplication(req.body, matchReport);
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

            if(!req.body.user || req.body.user.role !== Role.ADMIN) {
				for(let i = 0; i < result.data.applications.length; i++) {
					JobService.hideJobDataBasedOnHiddenColumns(result.data.applications[i].job);
				}
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

	public static async evaluateApplication(
		req: Request,
		res: Response
	): Promise<any> {
		try {

			if(!req.body.jobId) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message: "Invalid request body - jobId is required",
				});
			}

			if(!req.body.skillDescriptionMap) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message: "Invalid request body - skillDescriptionMap is required",
				});
			}

			if(!req.file || !req.file.buffer) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message: "Invalid request body - file is required",
				});
			}
 
			const result: GeneralAppResponse<AIEvaluationResponse> = await ApplicationService.evaluateMatch(
				req.body.jobId,
				req.body.skillDescriptionMap,
				req.file as Express.Multer.File
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
