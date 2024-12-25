import { Request, Response } from "express";
import { QuestionService } from "../services/question-service";
import { isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";

export class QuestionController {
	public static async getQuestions(req: Request, res: Response): Promise<any> {
		try {
			const result = await QuestionService.getAllQuestions();
			if (isGeneralAppFailureResponse(result)) {
				return res.status(result.statusCode).json({
					success: false,
					message: result.businessMessage,
					error: result.error,
				});
			}
			return res.status(HttpStatusCode.OK).json(result.data);
		} catch (error) {
			console.error(error);
			return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
}
