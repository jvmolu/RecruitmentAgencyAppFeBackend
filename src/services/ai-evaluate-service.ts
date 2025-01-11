import { GeneralAppResponse } from "../types/response/general-app-response";
import { AIEvaluationResponse } from "../types/response/ai-service-response";
import HttpStatusCode from "../types/enums/http-status-codes";

export interface AnalysisRequestData {
	jobDescription: {
		title: string;
		description?: string;
		skills?: string[];
		experienceRequired: string | number;
	};
	candidateProfile: {
		skills: any;
		experience: any;
		resumeUrl: string;
		noticePeriod: number;
		expectedSalary: number;
	};
}

export class AIEvaluateService {
	private static AI_SERVICE_URL = process.env.AI_SERVICE_URL;

	
}
