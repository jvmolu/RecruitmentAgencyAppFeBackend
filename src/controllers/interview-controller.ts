import { Request, Response } from "express";
import HttpStatusCode from "../types/enums/http-status-codes";
import { InterviewService } from "../services/interview-service";
import { isGeneralAppFailureResponse } from "../types/response/general-app-response";

export class InterviewController {
  public static async startInterview(req: Request, res: Response): Promise<any> {
    try {
      const { applicationId } = req.body;
      if (!applicationId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Application ID is required",
        });
      }
      const result = await InterviewService.startInterview(applicationId);
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

  public static async findByParams(req: Request, res: Response): Promise<any> {
    try {
      const result = await InterviewService.findByParams(req.body, req.query);
      if (isGeneralAppFailureResponse(result)) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.businessMessage,
          error: result.error,
        });
      }
      return res.status(HttpStatusCode.OK).json(result.data);
    } catch (error) {
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  public static async updateByParams(req: Request, res: Response): Promise<any> {
    try {
      const { searchFields, updateFields } = req.body;
      const result = await InterviewService.updateByParams(searchFields, updateFields);
      if (isGeneralAppFailureResponse(result)) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.businessMessage,
          error: result.error,
        });
      }
      return res.status(HttpStatusCode.OK).json(result.data);
    } catch (error) {
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  public static async submitAndGenerateQuestion(req: Request, res: Response): Promise<any> {
    try {
      const { questionId, answerText } = req.body;
      if (!questionId || !answerText) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Question ID and Answer Text are required",
        });
      }
      const result = await InterviewService.submitAndGenerateQuestion(questionId, answerText);
      if (isGeneralAppFailureResponse(result)) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.businessMessage,
          error: result.error,
        });
      }
      return res.status(HttpStatusCode.OK).json(result.data);
    } catch (error) {
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}