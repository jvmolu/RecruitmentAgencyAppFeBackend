import { UserService } from "../services/user-service";
import {Request, Response} from 'express';
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { isAuthError, isDatabaseError, isZodError } from "../types/error/general-app-error";
import { UserAuthData, UserAuthDataWithProfileData } from "../types/user-auth-data";
import HttpStatusCode from "../types/enums/http-status-codes";
import { User } from "../types/zod/user-entity";
import { hashPassword } from "../common/hash-util";

export class UserController {

    public static async createUser(req: Request, res: Response) : Promise<any> {
        try {
            
            const result : GeneralAppResponse<Omit<UserAuthDataWithProfileData, "password">> = await UserService.createUser(req.body);

            if (isGeneralAppFailureResponse(result)) {
                console.log('failure response');
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error
                });
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
            const result: GeneralAppResponse<User[]> = await UserService.findUsersByParams(req.body, req.query);
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

    public static async generateOTP(req: Request, res: Response): Promise<any> {
        try {
          const result = await UserService.generateOTP(req.body.email);
          if (isGeneralAppFailureResponse(result)) {            
              return res.status(result.statusCode).json({
                success: false,
                message: result.businessMessage,
                error: result.error,
              });
          }
          return res.status(HttpStatusCode.OK).json({
            success: true,
            message: 'OTP generated and sent to email',
          });
        } catch (error) {
          console.log(error);
          return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal server error',
          });
        }
    }

    public static async verifyOTP(req: Request, res: Response): Promise<any> {
        try {
            const { email, password, otp } = req.body;
        
            // Validate the OTP is between 100000 and 999999 and is a number
            if (!/^\d{6}$/.test(otp)) {
                return res.status(HttpStatusCode.BAD_REQUEST).json({
                success: false,
                message: 'Invalid OTP',
                });
            }

            const result = await UserService.verifyOTP(email, otp);
            if (isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error,
                });
            }

            // Hash Password
            const hashedPassword = await hashPassword(password);

            // Reset the password
            const userUpdateResult = await UserService.updateByParams({ email }, { password: hashedPassword });
            if (isGeneralAppFailureResponse(userUpdateResult)) {
                return res.status(userUpdateResult.statusCode).json({
                    success: false,
                    message: userUpdateResult.businessMessage,
                    error: userUpdateResult.error,
                });
            }

            return res.status(HttpStatusCode.OK).json({
                success: true,
                message: 'OTP verified successfully',
            });
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