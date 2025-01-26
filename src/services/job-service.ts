import { JobRepository } from "../repositories/job-repository";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { v4 as uuidv4 } from 'uuid';
import { JobSchema, JobSearchOptions, JobSearchSchema, JobType, Job, JobWithCompanyData, JobSearchParams, JobSearchParamsSchema } from "../types/zod/job-entity";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { Transactional } from "../decorators/transactional";
import { PoolClient } from "pg";
import AiService from "./ai-service";

export class JobService {

    private static jobRepository: JobRepository = new JobRepository();

    @Transactional()
    public static async createJob(jobData: Omit<JobType, 'id' | 'createdAt' | 'updatedAt'>, client?: PoolClient): Promise<GeneralAppResponse<JobType>> {
        
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

        let createResponse: GeneralAppResponse<JobType> = await JobService.jobRepository.create(job, client);
        if(isGeneralAppFailureResponse(createResponse)) {
            return createResponse;
        }

        // Generate an Embedding for this job from AI Service
        const jobEmbeddingResultGeneration: GeneralAppResponse<{
            jobId: string;
            embedding: number[];
        }> = await AiService.generateJobEmbedding(
            {
                title: job.title,
                objective: job.objective || '',
                goals: job.goals || '',
                jobDescription: job.jobDescription || '',
                skills: job.skills || [],
                experienceRequired: job.experienceRequired
            },
            job.id
        )
        if(isGeneralAppFailureResponse(jobEmbeddingResultGeneration)) {
            return jobEmbeddingResultGeneration;
        }

        return createResponse;
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

        return await this.jobRepository.findByParams(jobFields, jobSearchParams as JobSearchParams);
      }


    @Transactional()
    public static async updateJobs(jobSearchFields: Partial<JobSearchOptions>, jobUpdateFields: Partial<JobType>, client?: PoolClient): Promise<GeneralAppResponse<JobType[]>> {

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

        const updateResponse = await JobService.jobRepository.updateByParams(jobSearchFields, jobUpdateFields, client);
        if(isGeneralAppFailureResponse(updateResponse)) {
            return updateResponse;
        }

        // Update Embeddings for all updated jobs in setImmediate
        setImmediate(async () => {
            try {
                let promises = [];
                for(let i = 0; i < updateResponse.data.length; i++) {
                    const job = updateResponse.data[i];
                    const jobEmbeddingResultGeneration: Promise<GeneralAppResponse<{
                        jobId: string;
                        embedding: number[];
                    }>> = AiService.generateJobEmbedding(
                        {
                            title: job.title,
                            objective: job.objective || '',
                            goals: job.goals || '',
                            jobDescription: job.jobDescription || '',
                            skills: job.skills || [],
                            experienceRequired: job.experienceRequired
                        },
                        job.id
                    )
                    promises.push(jobEmbeddingResultGeneration);
                }
                const jobEmbeddingResults = await Promise.all(promises);
                for(let i = 0; i < jobEmbeddingResults.length; i++) {
                    if(isGeneralAppFailureResponse(jobEmbeddingResults[i])) {
                        console.error(jobEmbeddingResults[i]);
                    }
                }
            }
            catch(error) {
                console.error(error);
            }
        });

        return updateResponse;
    }

    public static fetchAndRemoveJobFields(sourceFields: any): Partial<JobSearchOptions> {
        const jobCols: string[] = ['workModel', 'jobType', 'location', 'title'];
        const jobFields: { [key: string]: any } = {};
        jobCols.forEach((col: string) => {
            if(sourceFields[col]) {
                jobFields[col] = sourceFields[col];
                delete sourceFields[col];
            }
        });
        return jobFields as Partial<JobSearchOptions>;
    }

    public static hideJobDataBasedOnHiddenColumns(job: Partial<JobWithCompanyData> | undefined): void {
        if(!job) {
            return;
        }
        let hiddenColumns: string[] | undefined = job.hiddenColumns;
        if(hiddenColumns) {
            delete(job.hiddenColumns);
            (hiddenColumns || []).forEach((column) => {
                delete((job as any)[column]);
            });
        }
    }
}