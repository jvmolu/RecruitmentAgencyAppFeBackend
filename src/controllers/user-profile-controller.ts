import { Request, Response } from 'express';
import { UserProfileService } from '../services/user-profile-service';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../types/response/general-app-response';
import HttpStatusCode from '../types/enums/http-status-codes';
import dotenv from 'dotenv';

dotenv.config({path: './../../.env'});

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
                const fileUploadResult: GeneralAppResponse<{
                    userId: string;
                    embedding: number[];
                    fileUrl: string;
                }> = await UserProfileService.uploadResumeAndUpdateEmbedding(bucketName, userIdentifier, file);
                if(isGeneralAppFailureResponse(fileUploadResult)) {
                    return res.status(fileUploadResult.statusCode).json({
                        success: false,
                        message: fileUploadResult.businessMessage,
                        error: fileUploadResult.error
                    });
                }

                profileData.resumeLink = fileUploadResult.data.fileUrl;
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

    public static async downloadFile(req: Request, res: Response): Promise<any> {
        try {

            let { fileUrl } = req.query;
            const bucketName = process.env.DIGITAL_OCEAN_BUCKET_NAME;

            if(!bucketName) {
                return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Internal server error',
                    error: 'Bucket name not found in environment variables'
                });
            }

            if(!fileUrl) {
                return res.status(HttpStatusCode.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid request',
                    error: 'fileUrl is required'
                });
            }

            fileUrl = fileUrl as string;

            const downloadResult: GeneralAppResponse<Buffer> = await UserProfileService.downloadFile(bucketName, fileUrl);
            if (isGeneralAppFailureResponse(downloadResult)) {
                return res.status(downloadResult.statusCode).json({
                    success: false,
                    message: downloadResult.businessMessage,
                    error: downloadResult.error
                });
            }

            if(!downloadResult.data) {
                return res.status(HttpStatusCode.NOT_FOUND).json({
                    success: false,
                    message: 'File not found',
                    error: 'File not found'
                });
            }

            // Check MIME Type
            const extension = fileUrl.split('.').pop();
            let mimeType = 'image/jpeg';
            if (extension === 'png') {
                mimeType = 'image/png';
            } else if (extension === 'jpg') {
                mimeType = 'image/jpg';
            } else if (extension === 'mp4') {
                mimeType = 'video/mp4';
            } else if (extension === 'pdf') {
                mimeType = 'application/pdf';
            }

            const fileName = fileUrl.split('/').pop();

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Length', downloadResult.data.length);
            res.send(downloadResult.data);
            
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

            const { profileSearchFields, profileUpdateFields, educationData, experienceData, userFields } = req.body;

            // Now Upload Resume (if any)
            if(req.file) {
                
                // Mandate userId in profileSearchFields
                if(!profileSearchFields.userId) {
                    return res.status(HttpStatusCode.BAD_REQUEST).json({
                        success: false,
                        message: 'Invalid request',
                        error: 'userId is required in profileSearchFields'
                    });
                }

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
                const fileUploadResult: GeneralAppResponse<{
                    userId: string;
                    embedding: number[];
                    fileUrl: string;
                }> = await UserProfileService.uploadResumeAndUpdateEmbedding(bucketName, userIdentifier, file);
                if(isGeneralAppFailureResponse(fileUploadResult)) {
                    return res.status(fileUploadResult.statusCode).json({
                        success: false,
                        message: fileUploadResult.businessMessage,
                        error: fileUploadResult.error
                    });
                }

                profileUpdateFields.resumeLink = fileUploadResult.data.fileUrl;
            }

            const result = await UserProfileService.updateUserProfileWithDetails(profileSearchFields, userFields, profileUpdateFields, educationData, experienceData);

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
            const result = await UserProfileService.findByParams(req.body, req.query);
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