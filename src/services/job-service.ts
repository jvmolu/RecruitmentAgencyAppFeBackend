import { JobRepository } from "../repositories/job-repository";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { v4 as uuidv4 } from 'uuid';
import { JobSchema, JobSearchOptions, JobSearchSchema, JobType, Job, JobWithCompanyData, JobSearchParams, JobSearchParamsSchema } from "../types/zod/job-entity";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { Company, CompanyType } from "../types/zod/company-entity";

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

    public static async findByParams(jobFields: Partial<JobSearchOptions>, jobSearchParams: Partial<JobSearchParams>): Promise<GeneralAppResponse<JobWithCompanyData[]>> {

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

        const jobSearchParamsValidationResult = JobSearchParamsSchema.safeParse(jobSearchParams);
        if(!jobSearchParamsValidationResult.success) {
            let zodError: ZodParsingError = jobSearchParamsValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid job search parameters',
                success: false
            };
        }

        jobFields = validationResult.data;
        jobSearchParams = jobSearchParamsValidationResult.data;

        console.log(jobFields, jobSearchParams);

        const jobs: GeneralAppResponse<JobWithCompanyData[]> = await this.jobRepository.findByParams(jobFields, jobSearchParams as JobSearchParams);
        if(isGeneralAppFailureResponse(jobs)) {
            return jobs;
        }

        for(let i = 0; i < jobs.data.length; i++) {
            let hiddenColumns: string[] | undefined = jobs.data[i].hiddenColumns;
            if(hiddenColumns) {
                delete(jobs.data[i].hiddenColumns);
                (hiddenColumns || []).forEach((column) => {
                  delete((jobs.data[i] as any)[column]);
                });
            }
        }

        return jobs;
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

        // Update updatedAt as well
        updateValidationResult.data.updatedAt = new Date().toISOString();

        jobUpdateFields = updateValidationResult.data;

        return await JobService.jobRepository.updateByParams(jobSearchFields, jobUpdateFields);
    }
}