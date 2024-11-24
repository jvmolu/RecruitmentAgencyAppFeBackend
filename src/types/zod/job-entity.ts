import ContractType from "../../enums/contract-type";
import Currency from "../../enums/currency";
import JobsType from "../../enums/job-type";
import PaymentPer from "../../enums/payment-per";
import Status from "../../enums/status";
import WorkModel from "../../enums/work-model";
import BaseSchema from "./base-entity";
import { z } from "zod";

// Define the schema for the Job model - CamelCase Fields
const JobSchema = BaseSchema.merge(
    z.object({
        companyId: z.string().uuid(),
        partnerId: z.string().uuid().optional(),
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
        requiredBy: z.string().datetime(),
        hiddenColumns: z.array(z.string()).optional(),
        location: z.string().min(1, 'Location must be at least 1 character'),
        workModel: z.nativeEnum(WorkModel),
        status: z.nativeEnum(Status).default(Status.ACTIVE), // If the status is not provided, default to Active
    })
);

type JobType = z.infer<typeof JobSchema>

class Job implements JobType {

    id: string;
    companyId: string;
    partnerId: string | undefined;
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

export { JobSchema, JobType, Job };
