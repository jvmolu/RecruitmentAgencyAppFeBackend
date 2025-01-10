import { z } from "zod";
import BaseSchema from "./base-entity";

const InterviewQuestionSchema = BaseSchema.merge(
	z.object({
		interviewId: z.string().uuid(),
		questionText: z.string().min(1),
		answer: z.string().optional(),
		videoLink: z.string().optional(),
		sequenceNumber: z.number().positive(),
		isAiGenerated: z.boolean().default(true),
		estimatedTimeMinutes: z.number().default(4),
	})
);

const InterviewQuestionSearchSchema = BaseSchema.merge(
    z.object({
        interviewId: z.string().uuid().nullable(),
        questionText: z.string().nullable(),
        answer: z.string().nullable(),
        videoLink: z.string().nullable(),
        sequenceNumber: z.number().positive().nullable(),
        isAiGenerated: z.boolean().nullable(),
        estimatedTimeMinutes: z.number().nullable(),
    })
);

type InterviewQuestionType = z.infer<typeof InterviewQuestionSchema>;
type InterviewQuestionSearchOptions = z.infer<typeof InterviewQuestionSearchSchema>;

export { 
    InterviewQuestionSchema,
    InterviewQuestionType,
    InterviewQuestionSearchSchema,
    InterviewQuestionSearchOptions
};