import { z } from "zod";
import BaseSchema from "./base-entity";

export enum InterviewStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
}

//change max
const InterviewQuestionSchema = BaseSchema.merge(
	z.object({
		interviewId: z.string().uuid(),
		questionText: z.string().min(1),
		answer: z.string().optional(),
		sequenceNumber: z.number().positive(),
		isAiGenerated: z.boolean().default(true),
		estimatedTimeMinutes: z.number().min(2).max(6).default(4),
	})
);

const InterviewSchema = BaseSchema.merge(
	z.object({
		jobId: z.string().uuid(),
		candidateId: z.string().uuid(),
		status: z.nativeEnum(InterviewStatus).default(InterviewStatus.PENDING),
		startedAt: z.string().datetime().optional(),
		completedAt: z.string().datetime().optional(),
	})
);

type InterviewType = z.infer<typeof InterviewSchema>;
type InterviewQuestionType = z.infer<typeof InterviewQuestionSchema>;

export {
	InterviewSchema,
	InterviewQuestionSchema,
	InterviewType,
	InterviewQuestionType,
};
