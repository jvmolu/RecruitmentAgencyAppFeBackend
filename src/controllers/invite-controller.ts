import {Request, Response} from 'express';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../types/response/general-app-response';
import { InviteType, InviteWithRelatedData } from '../types/zod/invite-entity';
import { InviteService } from '../services/invite-service';
import HttpStatusCode from '../types/enums/http-status-codes';

export class InviteController {

    public static async sendInvite(req: Request, res: Response) : Promise<any> {
        try {
            const result : GeneralAppResponse<InviteType> = await InviteService.sendAndCreateInvite(req.body);
            if (isGeneralAppFailureResponse(result)) {
                console.log(result);
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
            const result: GeneralAppResponse<InviteWithRelatedData[]> = await InviteService.findByParams(req.body, req.query);
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