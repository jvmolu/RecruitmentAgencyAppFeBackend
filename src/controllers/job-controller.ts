import HttpStatusCode from "../enums/http-status-codes";
import { Request, Response } from "express";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { JobService } from "../services/job-service";
import { isAuthError, isDatabaseError, isZodError } from "../types/error/general-app-error";
import { CompanyType } from "../types/zod/company-entity";
import { JobType } from "../types/zod/job-entity";

export class JobController {

    public static async createJob(req: Request, res: Response) : Promise<any> {
        try {
            const result: GeneralAppResponse<JobType> = await JobService.createJob(req.body);
            if(isGeneralAppFailureResponse(result)) {
                if(isDatabaseError(result.error) || isZodError(result.error) || isAuthError(result.error)) {
                    return res.status(result.statusCode).json({
                        success: false,
                        message: result.businessMessage,
                        error: result.error
                    });
                }
                else {
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error'
                    });
                }
            }
        }
        catch (error) {
            console.log(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    public static async findByParams(req: Request, res: Response) : Promise<any> {
        try {
            const result: GeneralAppResponse<JobType[]> = await JobService.findByParams(req.body);
            if(isGeneralAppFailureResponse(result)) {
                if(isDatabaseError(result.error) || isZodError(result.error) || isAuthError(result.error)) {
                    return res.status(result.statusCode).json({
                        success: false,
                        message: result.businessMessage,
                        error: result.error
                    });
                }
                else {
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error'
                    });
                }
            }
            return res.status(HttpStatusCode.OK).json(result);
        }
        catch (error) {
            console.log(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    public static async updateJobs(req: Request, res: Response) : Promise<any> {
        try {
            // Check if searchParams and updateParams are present in the request body
            if(!req.body.searchParams || !req.body.updateParams) {
                return res.status(HttpStatusCode.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid request body - searchParams and updateParams are required'
                });
            }
            const result: GeneralAppResponse<JobType[]> = await JobService.updateJobs(req.body.searchParams, req.body.updateParams);
            if(isGeneralAppFailureResponse(result)) {
                if(isDatabaseError(result.error) || isZodError(result.error) || isAuthError(result.error)) {
                    return res.status(result.statusCode).json({
                        success: false,
                        message: result.businessMessage,
                        error: result.error
                    });
                }
                else {
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error'
                    });
                }
            }
            return res.status(HttpStatusCode.OK).json(result);
        }
        catch (error) {
            console.log(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}