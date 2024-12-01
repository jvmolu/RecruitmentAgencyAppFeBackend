// src/controllers/match-report-controller.ts
import { Request, Response } from "express";
import { MatchReportService } from "../services/match-report-service";
import { isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";

export class MatchReportController {

    public static async createMatchReport(req: Request, res: Response): Promise<any> {

        try {
            const result = await MatchReportService.createMatchReport(req.body);
            if (isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error,
                });
            }
            return res.status(HttpStatusCode.CREATED).json(result);
        } 
        catch (error) {
            console.log(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    public static async findByParams(req: Request, res: Response): Promise<any> {
        try {
            const result = await MatchReportService.findByParams(req.body);
            if (isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error,
                });
            }
            return res.status(HttpStatusCode.OK).json(result);
        } 
        catch (error) {
            console.log(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }
}