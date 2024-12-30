import { UserExperienceRepository } from "../repositories/user-experiences-repository";
import { UserExperienceType, UserExperienceSchema, UserExperienceSearchOptions, UserExperienceSearchSchema } from "../types/zod/user-experience-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { PoolClient } from "pg";

export class UserExperienceService {

    private static userExperienceRepository: UserExperienceRepository = new UserExperienceRepository();

    public static async createUserExperience(experienceData: Omit<UserExperienceType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<UserExperienceType>> {
        const userExperience: UserExperienceType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...experienceData
        };

        const validationResult = UserExperienceSchema.safeParse(userExperience);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid user experience data',
                success: false
            };
        }

        return await this.userExperienceRepository.create(validationResult.data);
    }

    public static async findByParams(experienceFields: Partial<UserExperienceSearchOptions>): Promise<GeneralAppResponse<UserExperienceType[]>> {
        const validationResult = UserExperienceSearchSchema.partial().safeParse(experienceFields);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }

        return await this.userExperienceRepository.findByParams(validationResult.data);
    }

    public static async updateUserExperiences(experienceSearchFields: Partial<UserExperienceSearchOptions>, experienceUpdateFields: Partial<UserExperienceType>, client?: PoolClient): Promise<GeneralAppResponse<UserExperienceType[]>> {
        const searchValidationResult = UserExperienceSearchSchema.partial().safeParse(experienceSearchFields);
        if (!searchValidationResult.success) {
            let zodError: ZodParsingError = searchValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }

        const updateValidationResult = UserExperienceSchema.partial().safeParse(experienceUpdateFields);
        if (!updateValidationResult.success) {
            let zodError: ZodParsingError = updateValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid update data',
                success: false
            };
        }

        // Update updatedAt as well
        updateValidationResult.data.updatedAt = new Date().toISOString();

        return await this.userExperienceRepository.updateByParams(searchValidationResult.data, updateValidationResult.data, client);
    }

    public static async createUserExperienceBulk(experienceData: Omit<UserExperienceType, 'id' | 'createdAt' | 'updatedAt'>[], client?: PoolClient): Promise<GeneralAppResponse<UserExperienceType[]>> {
        
        const userExperienceData = experienceData.map(data => ({
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        const validationResult = UserExperienceSchema.array().safeParse(userExperienceData);
        if (!validationResult.success) {
            const zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid user experience data',
                success: false
            };
        }

        return await this.userExperienceRepository.createBulk(validationResult.data, client);
    }

    public static async deleteUserExperiences(educationSearchFields: Partial<UserExperienceSearchOptions>, client?: PoolClient): Promise<GeneralAppResponse<UserExperienceType[]>> {
        const searchValidationResult = UserExperienceSearchSchema.partial().safeParse(educationSearchFields);
        if (!searchValidationResult.success) {
            let zodError: ZodParsingError = searchValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }
        return await this.userExperienceRepository.deleteByParams(searchValidationResult.data, client);
    }
}