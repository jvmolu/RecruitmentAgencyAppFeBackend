import { z } from "zod";
import BaseSchema, { BaseSearchParams } from "./base-entity";
import InterviewStatus from "../enums/interview-status";
import { InterviewQuestionType } from "./interview-question";
import { ApplicationType } from "./application-entity";
import { JobType } from "./job-entity";

const InterviewSchema = BaseSchema.merge(
	z.object({
		jobId: z.string().uuid(),
		candidateId: z.string().uuid(),
		applicationId: z.string().uuid(),
		totalMarks: z.number().int().default(0),
		obtainedMarks: z.number().int().default(0),
		isChecked: z.boolean().default(false),
		status: z.nativeEnum(InterviewStatus).default(InterviewStatus.PENDING),
		startedAt: z.string().datetime().optional(),
		completedAt: z.string().datetime().optional(),
		// Interview Config
		totalQuestionsToAsk: z.number().int(),
	})
);

const InterviewSearchSchema = BaseSchema.merge(
	z.object({
		jobId: z.string().uuid().nullable(),
		candidateId: z.string().uuid().nullable(),
		applicationId: z.string().uuid().nullable(),
		totalQuestionsToAsk: z.number().int().nullable(),
		totalMarks: z.number().int().nullable(),
		obtainedMarks: z.number().int().nullable(),
		isChecked: z.boolean().nullable(),
		status: z.nativeEnum(InterviewStatus).nullable(),
		startedAt: z.string().datetime().nullable(),
		completedAt: z.string().datetime().nullable(),
	})
);

const InterviewSearchParamsSchema = BaseSearchParams.merge(
	z.object({
		// I will recieve strings and hence I need transformations which will convert the string to boolean
		isShowQuestions: z
		.union([z.boolean(), z.string()])
		.default(false)
		.transform((val) => (typeof val === "string" ? val === "true" : val)),
  
	  isShowApplicationData: z
		.union([z.boolean(), z.string()])
		.default(false)
		.transform((val) => (typeof val === "string" ? val === "true" : val)),
  
	  isShowJobData: z
		.union([z.boolean(), z.string()])
		.default(false)
		.transform((val) => (typeof val === "string" ? val === "true" : val)),
	})
);
	

type InterviewType = z.infer<typeof InterviewSchema>;
type InterviewSearchOptions = z.infer<typeof InterviewSearchSchema>;
type InterviewWithRelatedData = InterviewType & { 
	// // Question Text will always be there
	// questions?: (Partial<InterviewQuestionType> & {questionText: InterviewQuestionType['questionText']})[],
	// Questions will be fetched as a whole (all fields will be fetched from DB)
	questions?: InterviewQuestionType[],
	application?: Partial<ApplicationType>,
	job?: Partial<JobType> 
};
type InterviewSearchParams = z.infer<typeof InterviewSearchParamsSchema>;

export {
	InterviewSchema,
	InterviewType,
	InterviewSearchSchema,
	InterviewSearchOptions,
	InterviewWithRelatedData,
	InterviewSearchParamsSchema,
	InterviewSearchParams,
};
