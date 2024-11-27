import { JobRepository } from "../repositories/job-repository";
import { GeneralAppResponse } from "../types/response/general-app-response";
import { v4 as uuidv4 } from 'uuid';
import { JobSchema, JobSearchOptions, JobSearchSchema, JobType } from "../types/zod/job-entity";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../enums/http-status-codes";

export class JobService {

    private static jobRepository: JobRepository = new JobRepository();

    public static async createJob(jobData: Omit<JobType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<JobType>> {
        
        let job: JobType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...jobData
        }

        // Validate job data
        const validationResult = JobSchema.safeParse(job);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid job data',
                success: false
            };
        }
        job = validationResult.data;

        let response: GeneralAppResponse<JobType> = await JobService.jobRepository.create(job);
        return response;
    }

    public static async findByParams(jobFields: Partial<JobSearchOptions>): Promise<GeneralAppResponse<JobType[]>> {
        
        const validationResult = JobSearchSchema.partial().safeParse(jobFields);
        if(!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid job data',
                success: false
            };
        }

        jobFields = validationResult.data;
        return await JobService.jobRepository.findByParams(jobFields);
    }

    public static async updateJobs(jobSearchFields: Partial<JobSearchOptions>, jobUpdateFields: Partial<JobType>): Promise<GeneralAppResponse<JobType[]>> {

        // Validate job search data
        const validationResult = JobSearchSchema.partial().safeParse(jobSearchFields);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid job data',
                success: false
            };
        }
        jobSearchFields = validationResult.data;

        // Validate job update data
        const updateValidationResult = JobSchema.partial().safeParse(jobUpdateFields);
        if (!updateValidationResult.success) {
            let zodError: ZodParsingError = updateValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid job data',
                success: false
            };
        }
        jobUpdateFields = updateValidationResult.data;

        return await JobService.jobRepository.updateByParams(jobSearchFields, jobUpdateFields);
    }
}