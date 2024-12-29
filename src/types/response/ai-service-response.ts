export interface AIQuestion {
	question: string;
	estimated_time_minutes: number;
}

export interface AIServiceResponse {
	questions: AIQuestion[];
}
