import { UserEducationRepository } from "../repositories/user-education-repository";
import { UserEducationType, UserEducationSchema, UserEducationSearchOptions, UserEducationSearchSchema } from "../types/zod/user-education-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { PoolClient } from "pg";

export class UserEducationService {

    private static userEducationRepository: UserEducationRepository = new UserEducationRepository();

    public static async createUserEducation(educationData: Omit<UserEducationType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<UserEducationType>> {
        const userEducation: UserEducationType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...educationData
        };

        const validationResult = UserEducationSchema.safeParse(userEducation);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid user education data',
                success: false
            };
        }

        return await this.userEducationRepository.create(validationResult.data);
    }

    public static async findByParams(educationFields: Partial<UserEducationSearchOptions>): Promise<GeneralAppResponse<UserEducationType[]>> {
        const validationResult = UserEducationSearchSchema.partial().safeParse(educationFields);
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

        return await this.userEducationRepository.findByParams(validationResult.data);
    }

    public static async updateUserEducations(educationSearchFields: Partial<UserEducationSearchOptions>, educationUpdateFields: Partial<UserEducationType>, client?: PoolClient): Promise<GeneralAppResponse<UserEducationType[]>> {
        const searchValidationResult = UserEducationSearchSchema.partial().safeParse(educationSearchFields);
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

        const updateValidationResult = UserEducationSchema.partial().safeParse(educationUpdateFields);
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

        return await this.userEducationRepository.updateByParams(searchValidationResult.data, updateValidationResult.data, client);
    }

    public static async createUserEducationBulk(educationData: Omit<UserEducationType, 'id' | 'createdAt' | 'updatedAt'>[], client?: PoolClient): Promise<GeneralAppResponse<UserEducationType[]>> {

        const userEducationData = educationData.map(data => ({
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        const validationResult = UserEducationSchema.array().safeParse(userEducationData);
        if (!validationResult.success) {
            const zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid user education data',
                success: false
            };
        }

        return await this.userEducationRepository.createBulk(validationResult.data, client);
    }

    public static async deleteUserEducations(educationSearchFields: Partial<UserEducationSearchOptions>, client?: PoolClient): Promise<GeneralAppResponse<UserEducationType[]>> {
        const searchValidationResult = UserEducationSearchSchema.partial().safeParse(educationSearchFields);
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
        return await this.userEducationRepository.deleteByParams(searchValidationResult.data, client);
    }
}