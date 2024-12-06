import { Request, Response } from 'express';
import { UserProfileService } from '../services/user-profile-service';
import { UserProfileType } from '../types/zod/user-profile-entity';
import { UserEducationType } from '../types/zod/user-education-entity';
import { UserExperienceType } from '../types/zod/user-experience-entity';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../types/response/general-app-response';
import HttpStatusCode from '../types/enums/http-status-codes';
import { UserEducationService } from '../services/user-education-service';
import { UserExperienceService } from '../services/user-experiences-service';

export class UserProfileController {
    
    public static async createUserProfile(req: Request, res: Response): Promise<any> {
        try {
            const { profileData, educationData, experienceData } = req.body;

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

    public static async findUserProfile(req: Request, res: Response): Promise<any> {
    }

}