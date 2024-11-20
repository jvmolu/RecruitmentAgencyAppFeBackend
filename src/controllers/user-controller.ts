import { UserService } from "../services/user-service";
import {Request, Response} from 'express';
import {ZodError} from 'zod';
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { isDatabaseError, isZodError } from "../types/error/general-app-error";
import { UserAuthData } from "../types/response/user-auth-data-response";

export class UserController {

    private static userService: UserService = new UserService();

    public static async createUser(req: Request, res: Response) : Promise<any> {
        try {
            
            const result : GeneralAppResponse<UserAuthData> = await UserController.userService.createUser(req.body);

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
                    return res.status(500).json({
                        success: false,
                        message: 'Internal server error'
                    });
                }
            }
            
            // User created successfully
            return res.status(201).json(result);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    public static async findAllUsers(req: Request, res: Response) : Promise<any> {
        try {
            
            console.log('find all users');
            const result = await UserController.userService.findAllUsers();

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
                    return res.status(500).json({
                        success: false,
                        message: 'Internal server error'
                    });
                }
            }

            return res.status(200).json(result);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}