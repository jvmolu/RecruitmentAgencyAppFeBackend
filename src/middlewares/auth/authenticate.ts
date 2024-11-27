import {Request, Response, NextFunction} from 'express';
import { UserService } from '../../services/user-service';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../../types/response/general-app-response';
import { UserAuthData } from '../../types/user-auth-data';
import HttpStatusCode from '../../types/enums/http-status-codes';

const Authenticate = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try {
        const token: string | undefined = req.headers.authorization;
        const authResponse: GeneralAppResponse<Omit<UserAuthData, "password">> = await UserService.findUserByToken(token);
    
        if(isGeneralAppFailureResponse(authResponse)) {
            res.status(authResponse.statusCode).json({
                success: false,
                message: authResponse.businessMessage,
                error: authResponse.error
            });
        }
        else {
            req.body.user = authResponse.data;
            next();
        }
    }
    catch (error) {
        console.log(error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export default Authenticate;
