import { Request, Response } from "express";
import { InterviewService } from "../services/interview-service";
import { isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";

export class InterviewController {
	public static async startInterview(
		req: Request,
		res: Response
	): Promise<any> {
		try {
			const { candidateId, jobId, cvData, jobDescription } = req.body;

			// Validate required fields
			if (!candidateId || !jobId || !cvData || !jobDescription) {
				return res.status(HttpStatusCode.BAD_REQUEST).json({
					success: false,
					message: "Missing required fields",
				});
			}

			const result = await InterviewService.startInterview(
				candidateId,
				jobId,
				cvData,
				jobDescription
			);

			if (isGeneralAppFailureResponse(result)) {
				return res.status(result.statusCode).json({
					success: false,
					message: result.businessMessage,
					error: result.error,
				});
			}

			return res.status(HttpStatusCode.CREATED).json(result);
		} catch (error) {
			return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
}
