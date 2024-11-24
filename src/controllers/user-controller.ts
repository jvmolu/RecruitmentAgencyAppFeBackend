import { UserService } from "../services/user-service";
import {Request, Response} from 'express';
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { isAuthError, isDatabaseError, isZodError } from "../types/error/general-app-error";
import { UserAuthData } from "../types/user-auth-data";
import HttpStatusCode from "../enums/http-status-codes";

export class UserController {

    public static async createUser(req: Request, res: Response) : Promise<any> {
        try {
            
            const result : GeneralAppResponse<Omit<UserAuthData, "password">> = await UserService.createUser(req.body);

            if (isGeneralAppFailureResponse(result)) {
                console.log('failure response');
                if(isDatabaseError(result.error) || isZodError(result.error)) {
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
            
            // User created successfully
            return res.status(HttpStatusCode.CREATED).json(result);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    public static async loginUser(req: Request, res: Response) : Promise<any> {
        try {
            
            console.log('login user');
            const result : GeneralAppResponse<Omit<UserAuthData, "password">> = await UserService.loginUser(req.body);

            if (isGeneralAppFailureResponse(result)) {
                if(isDatabaseError(result.error) || isZodError(result.error) || isAuthError(result.error)) {
                    return res.status(result.statusCode).json({
                        success: false,
                        message: result.businessMessage,
                        error: result.error
                    });
                } else {
                    // Something went wrong - internal server error
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error'
                    });
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

    public static async findAllUsers(req: Request, res: Response) : Promise<any> {
        try {
            
            console.log('find all users');
            const result = await UserService.findAllUsers();

            if (isGeneralAppFailureResponse(result)) {
                console.log('failure response');
                if(isDatabaseError(result.error) || isZodError(result.error)) {
                    return res.status(result.statusCode).json({
                        success: false,
                        message: result.businessMessage,
                        error: result.error
                    });
                } else {
                    // Something went wrong - internal server error
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error'
                    });
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

    public static async findUserByToken(req: Request, res: Response) : Promise<any> { 
        try {
            // Trace has been added by authentication middleware - directly return the user
            return res.status(HttpStatusCode.OK).json(req.body.user);
        } catch (error) {
            console.log(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    public static async findUsersByParams(req: Request, res: Response) : Promise<any> {

        try {
            const result = await UserService.findUsersByParams(req.body);
            if (isGeneralAppFailureResponse(result)) {
                console.log('failure response');
                if(isDatabaseError(result.error) || isZodError(result.error)) {
                    return res.status(result.statusCode).json({
                        success: false,
                        message: result.businessMessage,
                        error: result.error
                    });
                } else {
                    // Something went wrong - internal server error
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error'
                    });
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
}