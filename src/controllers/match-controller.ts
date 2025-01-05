// src/controllers/match-controller.ts
import { Request, Response } from "express";
import { MatchService } from "../services/match-service";
import { isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import { isAuthError, isDatabaseError, isZodError } from "../types/error/general-app-error";

export class MatchController {
  public static async createMatch(req: Request, res: Response): Promise<any> {
    try {
      const result = await MatchService.createMatch(req.body);
      if (isGeneralAppFailureResponse(result)) {
        if (isDatabaseError(result.error) || isZodError(result.error) || isAuthError(result.error)) {
          return res.status(result.statusCode).json({
            success: false,
            message: result.businessMessage,
            error: result.error,
          });
        }
        return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Internal server error',
        });
      }
      return res.status(HttpStatusCode.CREATED).json(result);
    } catch (error) {
      console.log(error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  public static async findByParams(req: Request, res: Response): Promise<any> {
    try {
      const result = await MatchService.findByParams(req.body, req.query);
      if (isGeneralAppFailureResponse(result)) {
          return res.status(result.statusCode).json({
            success: false,
            message: result.businessMessage,
            error: result.error,
          });
      }
      return res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      console.log(error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}