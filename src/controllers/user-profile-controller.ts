import { Request, Response } from 'express';
import { UserProfileService } from '../services/user-profile-service';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../types/response/general-app-response';
import HttpStatusCode from '../types/enums/http-status-codes';


export class UserProfileController {
    
    public static async createUserProfile(req: Request, res: Response): Promise<any> {
        try {

            const { profileData, educationData, experienceData } = req.body;

            // Now Upload Resume (if any)
            if(req.file) {
                
                const file: Express.Multer.File = req.file;
                const bucketName: string | undefined = process.env.DIGITAL_OCEAN_BUCKET_NAME;
                if(!bucketName) {
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error',
                        error: 'Bucket name not found in environment variables'
                    });
                }

                const userIdentifier: string = profileData.userId;
                const fileUploadResult: GeneralAppResponse<string> = await UserProfileService.uploadResume(bucketName, userIdentifier, file);
                if(isGeneralAppFailureResponse(fileUploadResult)) {
                    return res.status(fileUploadResult.statusCode).json({
                        success: false,
                        message: fileUploadResult.businessMessage,
                        error: fileUploadResult.error
                    });
                }

                profileData.resumeLink = fileUploadResult.data;
            }

            const result = await UserProfileService.createUserProfileWithDetails(profileData, educationData, experienceData);

            if (isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error
                });
            }

            return res.status(HttpStatusCode.CREATED).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
                error
            });
        }
    }

    public static async updateUserProfile(req: Request, res: Response): Promise<any> {
        try {

            const { profileSearchFields, profileUpdateFields, educationData, experienceData } = req.body;

            // Mandate userId in profileSearchFields
            if(!profileSearchFields.userId) {
                return res.status(HttpStatusCode.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid request',
                    error: 'userId is required in profileSearchFields'
                });
            }

            // Now Upload Resume (if any)
            if(req.file) {
                
                const file: Express.Multer.File = req.file;
                const bucketName: string | undefined = process.env.DIGITAL_OCEAN_BUCKET_NAME;
                if(!bucketName) {
                    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Internal server error',
                        error: 'Bucket name not found in environment variables'
                    });
                }

                const userIdentifier: string = profileSearchFields.userId;
                const fileUploadResult: GeneralAppResponse<string> = await UserProfileService.uploadResume(bucketName, userIdentifier, file);
                if(isGeneralAppFailureResponse(fileUploadResult)) {
                    return res.status(fileUploadResult.statusCode).json({
                        success: false,
                        message: fileUploadResult.businessMessage,
                        error: fileUploadResult.error
                    });
                }

                profileUpdateFields.resumeLink = fileUploadResult.data;
            }

            const result = await UserProfileService.updateUserProfileWithDetails(profileSearchFields, profileUpdateFields, educationData, experienceData);

            if (isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error
                });
            }

            return res.status(HttpStatusCode.OK).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
                error
            });
        }
    }

    public static async findByParams(req: Request, res: Response): Promise<any> {
        try {
            const result = await UserProfileService.findByParams(req.body);
            if (isGeneralAppFailureResponse(result)) {
                return res.status(result.statusCode).json({
                    success: false,
                    message: result.businessMessage,
                    error: result.error
                });
            }
            return res.status(HttpStatusCode.OK).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error(error);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error',
                error
            });
        }
    }
}