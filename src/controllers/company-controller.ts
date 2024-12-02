import HttpStatusCode from "../types/enums/http-status-codes";
import { CompanyService } from "../services/company-service";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { CompanyType } from "../types/zod/company-entity";
import {Request, Response} from 'express';

export class CompanyController {

    public static async createCompany(req: Request, res: Response) : Promise<any> {
        try {

            const result: GeneralAppResponse<CompanyType> = await CompanyService.createCompany(req.body);
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

    public static async findByParams(req: Request, res: Response) : Promise<any> {
        try {
            const result: GeneralAppResponse<CompanyType[]> = await CompanyService.findByParams(req.body);
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