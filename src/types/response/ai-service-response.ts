import { z } from "zod";

export interface AIQuestion {
	question: string;
}

export interface AIGenerateQuestionResponse {
	questions: AIQuestion[];
}

export interface RequirementMatch {
	requirement: string;
	expectation: string; // Important hardcoded
	additionalComment: string;
	matchPercentage: number;
}

export interface AIEvaluationResponse {
	overallMatch: number;
	overallComment: string;
	requirements: RequirementMatch[];
}

export const AiQuestionZodSchema = z.object({
	question: z.string()
});

export const AIGenerateQuestionResponseZodSchema = z.object({
	questions: z.array(AiQuestionZodSchema)
});

export const AIEvaluationResponseZodSchema = z.object({
	overallMatch: z.number(),
	requirements: z.array(z.object({
		requirement: z.string(),
		expectation: z.string(),
		candidateProfile: z.string(),
		matchPercentage: z.number()
	}))
});

