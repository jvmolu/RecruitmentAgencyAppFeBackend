import { z } from "zod";
import BaseSchema from "./base-entity";
import InterviewStatus from "../enums/interview-status";
import { InterviewQuestionType } from "./interview-question";

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

type InterviewType = z.infer<typeof InterviewSchema>;
type InterviewSearchOptions = z.infer<typeof InterviewSearchSchema>;
type InterviewWithRelatedData = InterviewType & { questions: Partial<InterviewQuestionType>[] | undefined };

export {
	InterviewSchema,
	InterviewType,
	InterviewSearchSchema,
	InterviewSearchOptions,
	InterviewWithRelatedData,
};
