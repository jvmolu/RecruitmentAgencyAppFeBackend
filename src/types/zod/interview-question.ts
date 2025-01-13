import { z } from "zod";
import BaseSchema from "./base-entity";

const InterviewQuestionSchema = BaseSchema.merge(
	z.object({
		interviewId: z.string().uuid(),
		questionText: z.string().min(1),
        category: z.string().optional(),
		answer: z.string().optional(),
		videoLink: z.string().optional(),
		sequenceNumber: z.number().positive(),
        totalMarks: z.number().int().default(0),
		obtainedMarks: z.number().int().default(0),
		isChecked: z.boolean().default(false),
		isAiGenerated: z.boolean().default(true),
		estimatedTimeMinutes: z.number().default(4),
	})
);

const InterviewQuestionSearchSchema = BaseSchema.merge(
    z.object({
        interviewId: z.string().uuid().nullable(),
        questionText: z.string().nullable(),
        answer: z.string().nullable(),
        category: z.string().nullable(),
        videoLink: z.string().nullable(),
        sequenceNumber: z.number().positive().nullable(),
        totalMarks: z.number().int().nullable(),
        obtainedMarks: z.number().int().nullable(),
        isChecked: z.boolean().nullable(),
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