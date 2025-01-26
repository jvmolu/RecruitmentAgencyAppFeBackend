import HttpStatusCode from "../types/enums/http-status-codes";
import { Request, Response } from "express";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { JobService } from "../services/job-service";
import { JobType, JobWithCompanyData } from "../types/zod/job-entity";
import Role from "../types/enums/role";
import { MatchType } from "../types/zod/match-entity";

export class JobController {

    public static async createJob(req: Request, res: Response) : Promise<any> {
        try {
            const result: GeneralAppResponse<JobType> = await JobService.createJob(req.body);
            if(isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error
                });
            }
            return res.status(HttpStatusCode.CREATED).json(result);
        }
        catch (error) {
            console.log(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    public static async findByParams(req: Request, res: Response): Promise<any> {
        try {
            const result: GeneralAppResponse<JobWithCompanyData[]>  = await JobService.findByParams(req.body, req.query);
            if (isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                success: false,
                message: result.businessMessage,
                error: result.error,
                });
            }
            
            if(!req.body.user || req.body.user.role !== Role.ADMIN) {
                for(let i = 0; i < result.data.length; i++) {
                    JobService.hideJobDataBasedOnHiddenColumns(result.data[i]);
                }
            }

            return res.status(HttpStatusCode.OK).json(result);
        } catch (error) {
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
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error
                });
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

    public static async getMatchesForJob(req: Request, res: Response) : Promise<any> {
        try {

            const {jobId, threshold} = req.body;
            if(!jobId) {
                return res.status(HttpStatusCode.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid request body - jobId is required'
                });
            }

            const result: GeneralAppResponse<MatchType[]> = await JobService.getMatchesForJob(jobId, threshold);
            if(isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error
                });
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