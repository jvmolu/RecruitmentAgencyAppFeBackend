import { GeneralAppResponse } from "../types/response/general-app-response";
import { QuestionType } from "../types/zod/question-entity";
import { QuestionRepository } from "../repositories/questions-repository";

export class QuestionService {
	private static questionRepository = new QuestionRepository();

	public static async getAllQuestions(): Promise<
		GeneralAppResponse<QuestionType[]>
	> {
		return await this.questionRepository.findAll();
	}

	public static async getQuestionByNumber(
		questionNumber: number
	): Promise<GeneralAppResponse<QuestionType>> {
		return await this.questionRepository.findOne(questionNumber);
	}
}
