export interface AIQuestion {
	question: string;
	estimated_time_minutes: number;
}

export interface AIServiceResponse {
	questions: AIQuestion[];
}

export interface AIFollowUpResponse {
	question: string;
	estimated_time_minutes: number;
}

export interface RequirementMatch {
	requirement: string;
	expectation: string;
	candidateProfile: string;
	matchPercentage: number;
}

export interface AIEvaluationResponse {
	overallMatch: number;
	requirements: RequirementMatch[];
}
