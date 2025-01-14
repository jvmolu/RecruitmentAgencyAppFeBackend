import ContractType from "../enums/contract-type";
import Currency from "../enums/currency";
import JobsType from "../enums/job-type";
import PaymentPer from "../enums/payment-per";
import Status from "../enums/status";
import WorkModel from "../enums/work-model";
import BaseSchema, { BaseSearchParams } from "./base-entity";
import { z } from "zod";
import { CompanyType } from "./company-entity";
import { DateRange, NumberRange } from "./range-entities";

// Define the schema for the Job model - CamelCase Fields
const JobSchema = BaseSchema.merge(
    z.object({
        companyId: z.string().uuid(),
        partnerId: z.string().uuid().optional(),
        experienceRequired: z.number().int().default(0),
        budgetAmount: z.number().int().optional(),
        budgetCurrency: z.nativeEnum(Currency).optional(),
        budgetPer: z.nativeEnum(PaymentPer).optional(),
        jobType: z.nativeEnum(JobsType),
        contractType: z.nativeEnum(ContractType),
        title: z.string().min(1, 'Job title must be at least 1 character'),
        objective: z.string().optional(),
        goals: z.string().optional(),
        jobDescription: z.string().optional(),
        skills: z.array(z.string()).optional(),
        quantity: z.number().int(),
        requiredBy: z.string().date(),
        hiddenColumns: z.array(z.string()).optional(),
        location: z.string().min(1, 'Location must be at least 1 character'),
        workModel: z.nativeEnum(WorkModel),
        status: z.nativeEnum(Status).default(Status.ACTIVE), // If the status is not provided, default to Active
    })
);

const JobSearchSchema = BaseSchema.merge(
    z.object({
        companyId: z.string().uuid().nullable(),
        partnerId: z.string().uuid().nullable(),
        experienceRequired: z.number().int().nullable(),
        budgetAmount: z.number().int().nullable(),
        budgetCurrency: z.nativeEnum(Currency).nullable(),
        budgetPer: z.nativeEnum(PaymentPer).nullable(),
        jobType: z.nativeEnum(JobsType).nullable(),
        contractType: z.nativeEnum(ContractType).nullable(),
        title: z.string().nullable(),
        objective: z.string().nullable(),
        goals: z.string().nullable(),
        jobDescription: z.string().nullable(),
        skills: z.array(z.string()).nullable(),
        quantity: z.number().int().nullable(),
        requiredBy: z.string().date().nullable(),
        hiddenColumns: z.array(z.string()).nullable(),
        location: z.string().nullable(),
        workModel: z.nativeEnum(WorkModel).nullable(),
        status: z.nativeEnum(Status).nullable(),

        // Min-Max Options - Handled in repository
        // Range will be like: {min: 0, max: 10}
        experienceRequiredRange: NumberRange.optional(),
        budgetAmountRange: NumberRange.optional(),
        createdAtRange: DateRange.optional(),
        updatedAtRange: DateRange.optional()
    })
);

const JobSearchParamsSchema = BaseSearchParams.merge(
    z.object({
        // I will recieve strings and hence I need transformations which will convert the string to boolean
        isShowCompanyData: z
            .union([z.boolean(), z.string()])
            .default(true)
            .transform((val) => (typeof val === "string" ? val === "true" : val)),
        
        isShowPartnerData: z
            .union([z.boolean(), z.string()])
            .default(true)
            .transform((val) => (typeof val === "string" ? val === "true" : val)),
        
        isShowAppliesCount: z
            .union([z.boolean(), z.string()])
            .default(false)
            .transform((val) => (typeof val === "string" ? val === "true" : val)),
        
        isShowMatchesCount: z
            .union([z.boolean(), z.string()])
            .default(false)
            .transform((val) => (typeof val === "string" ? val === "true" : val))
    })
);

type JobType = z.infer<typeof JobSchema>
type JobSearchOptions = z.infer<typeof JobSearchSchema>
type JobWithCompanyData = (Partial<Job> & { company: Partial<CompanyType> | undefined, partner: Partial<CompanyType> | undefined, appliesCount: number | undefined, matchesCount: number | undefined });
type JobSearchParams = z.infer<typeof JobSearchParamsSchema>

class Job implements JobType {

    id: string;
    companyId: string;
    partnerId: string | undefined;
    experienceRequired: number;
    budgetAmount: number | undefined;
    budgetCurrency: Currency | undefined;
    budgetPer: PaymentPer | undefined;
    jobType: JobsType;
    contractType: ContractType;
    title: string;
    objective: string | undefined;
    goals: string | undefined;
    jobDescription: string | undefined;
    skills: string[] | undefined;
    quantity: number;
    requiredBy: string;
    hiddenColumns: string[] | undefined;
    location: string;
    workModel: WorkModel;
    status: Status;
    createdAt: string;
    updatedAt: string;

    constructor(jobData: JobType) {

        // This will throw if validation fails
        const validatedJob = JobSchema.parse(jobData);

        this.id = validatedJob.id;
        this.companyId = validatedJob.companyId;
        this.partnerId = validatedJob.partnerId;
        this.experienceRequired = validatedJob.experienceRequired;
        this.budgetAmount = validatedJob.budgetAmount;
        this.budgetCurrency = validatedJob.budgetCurrency;
        this.budgetPer = validatedJob.budgetPer;
        this.jobType = validatedJob.jobType;
        this.contractType = validatedJob.contractType;
        this.title = validatedJob.title;
        this.objective = validatedJob.objective;
        this.goals = validatedJob.goals;
        this.jobDescription = validatedJob.jobDescription;
        this.skills = validatedJob.skills;
        this.quantity = validatedJob.quantity;
        this.requiredBy = validatedJob.requiredBy;
        this.hiddenColumns = validatedJob.hiddenColumns;
        this.location = validatedJob.location;
        this.workModel = validatedJob.workModel;
        this.status = validatedJob.status;
        this.createdAt = validatedJob.createdAt;
        this.updatedAt = validatedJob.updatedAt;
    }
}

export { JobSchema, JobType, Job, JobSearchSchema, JobSearchOptions, JobWithCompanyData, JobSearchParamsSchema, JobSearchParams };
