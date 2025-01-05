import { z } from "zod";
import BaseSchema from "./base-entity";

export const QuestionSchema = BaseSchema.extend({
	questionText: z.string().min(1, "Question text cannot be empty"),
	timeLimit: z.number().int().min(1).default(10),
	status: z
		.enum(["current", "pending", "submitted", "skipped"])
		.default("pending"),
});

export type QuestionType = z.infer<typeof QuestionSchema>;
