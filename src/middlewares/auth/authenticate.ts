import {Request, Response, NextFunction} from 'express';
import { UserService } from '../../services/user-service';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../../types/response/general-app-response';
import { UserAuthData } from '../../types/response/user-auth-data-response';

const Authenticate = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {

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

export default Authenticate;
