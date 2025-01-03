import { ApplicationRepository } from "../repositories/applications-repository";
import { ApplicationType, ApplicationSchema, ApplicationSearchOptions, ApplicationSearchSchema, ApplicationWithRelatedData, ApplicationSearchParams, ApplicationSearchParamsSchema } from "../types/zod/application-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { PoolClient } from "pg";
import S3Service from "./aws-service";
import { ApplicationLifecycleType } from "../types/zod/application-lifecycle-entity";
import { v4 as uuidv4 } from "uuid";
import { Transactional } from "../decorators/transactional";
import { BadRequestError } from "../types/error/bad-request-error";

export class ApplicationService {

    private static applicationRepository: ApplicationRepository = new ApplicationRepository();
    private static s3Service: S3Service = S3Service.getInstance();

    @Transactional()
    public static async createApplication(applicationData: Omit<ApplicationType, 'createdAt' | 'updatedAt'>, client?: PoolClient): Promise<GeneralAppResponse<ApplicationType>> {
        const application: ApplicationType = {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...applicationData
        };

        const validationResult = ApplicationSchema.safeParse(application);
        if (!validationResult.success) {
            const zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid application data',
                success: false
            };
        }

        const applicationRes = await this.applicationRepository.create(validationResult.data, client);
        if (isGeneralAppFailureResponse(applicationRes)) {
            return applicationRes;
        }

        // Insert application lifecycle data
        const lifecycleData: ApplicationLifecycleType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            applicationId: applicationRes.data.id,
            status: applicationRes.data.stage,
            notes: 'Application created',
        };

        const insertStatusRes = await this.applicationRepository.insertLifecycles([lifecycleData], client);
        if (isGeneralAppFailureResponse(insertStatusRes)) {
            return insertStatusRes;
        }

        return applicationRes;
    }

    public static async findByParams(
        applicationFields: Partial<ApplicationSearchOptions>,
        applicationSearchParams: Partial<ApplicationSearchParams>
    ) : Promise<GeneralAppResponse<ApplicationWithRelatedData[]>> {

        const validationResult = ApplicationSearchSchema.partial().safeParse(applicationFields);
        if (!validationResult.success) {
            const zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }

        const searchParamsValidationResult = ApplicationSearchParamsSchema.safeParse(applicationSearchParams);
        if (!searchParamsValidationResult.success) {
            const zodError: ZodParsingError = searchParamsValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }

        return await this.applicationRepository.findByParams(validationResult.data, searchParamsValidationResult.data as ApplicationSearchParams);
    }

    @Transactional()
    public static async updateApplications(
        applicationSearchFields: Partial<ApplicationSearchOptions>, 
        applicationUpdateFields: Partial<ApplicationType>, 
        client?: PoolClient
    ): Promise<GeneralAppResponse<ApplicationType[]>> {
        const searchValidationResult = ApplicationSearchSchema.partial().safeParse(applicationSearchFields);
        if (!searchValidationResult.success) {
            const zodError: ZodParsingError = searchValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }

        const updateValidationResult = ApplicationSchema.partial().safeParse(applicationUpdateFields);
        if (!updateValidationResult.success) {
            const zodError: ZodParsingError = updateValidationResult.error as ZodParsingError;
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

        const updateApplicationRes = await this.applicationRepository.updateByParams(searchValidationResult.data, updateValidationResult.data, client);
        if (isGeneralAppFailureResponse(updateApplicationRes)) {
            return updateApplicationRes;
        }

        // Status can only be updated for a single application at a time
        if(updateValidationResult.data.stage) {

            if(updateApplicationRes.data.length > 1) {
                let badRequestError: BadRequestError = new Error('Status can only be updated for a single application at a time') as BadRequestError;
                badRequestError.errorType = 'BadRequestError';
                return {
                    error: badRequestError,
                    statusCode: HttpStatusCode.BAD_REQUEST,
                    businessMessage: 'Invalid update data',
                    success: false
                };    
            }

            const lifecycleData: ApplicationLifecycleType = {
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                applicationId: updateApplicationRes.data[0].id,
                status: updateValidationResult.data.stage,
                notes: 'Status updated',
            };
            
            const insertStatusRes = await this.applicationRepository.insertLifecycles([lifecycleData], client);
            if (isGeneralAppFailureResponse(insertStatusRes)) {
                return insertStatusRes;
            }
        }
    
        return updateApplicationRes;
    }

    /**
     * @method uploadResume
     * @description Handles the upload of a resume file to DigitalOcean Spaces.
     * @param file - The file to be uploaded.
     * @param bucketName - The name of the bucket to upload the file to.
     * @param applicationId - The identifier for the application.
     * @returns Promise resolving to a GeneralAppResponse containing the file URL or an error.
    **/
    public static async uploadResume(bucketName: string, applicationId: string, file: Express.Multer.File): Promise<GeneralAppResponse<string>> {

        const fileUrl: string = `/cand/applications/${applicationId}/resume.pdf`;
        const uploadResult: GeneralAppResponse<void> = await this.s3Service.uploadFile(bucketName, fileUrl, file.buffer);

        if(isGeneralAppFailureResponse(uploadResult)) {
            return {
                success: false,
                businessMessage: uploadResult.businessMessage,
                error: uploadResult.error,
                statusCode: uploadResult.statusCode
            };
        }

        return {
            success: true,
            data: fileUrl
        };
    }
}