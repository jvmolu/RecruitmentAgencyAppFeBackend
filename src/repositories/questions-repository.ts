import { PoolClient } from "pg";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import { GeneralAppResponse } from "../types/response/general-app-response";
import { QuestionType } from "../types/zod/question-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { DataNotFoundError } from "../types/error/data-not-found-error";
import QueryOperation from "../types/enums/query-operation";

class QuestionRepository extends BaseRepository {
	constructor() {
		super(DbTable.QUESTIONS);
	}

	async findAll(): Promise<GeneralAppResponse<QuestionType[]>> {
		try {
			const { query } = QueryBuilder.buildSelectQuery(this.tableName);
			return await this.executeQuery<QuestionType>(query);
		} catch (error: any) {
			return {
				error,
				businessMessage: "Error fetching questions",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				success: false,
			};
		}
	}

	async findOne(
		questionNumber: number
	): Promise<GeneralAppResponse<QuestionType>> {
		try {
			const { query, params } = QueryBuilder.buildSelectQuery(
				this.tableName,
				{},
				"t0",
				[],
				[],
				[],
				1,
				questionNumber - 1
			);
			const result = await this.executeQuery<QuestionType>(query, params);
			if (result.success && result.data.length > 0) {
				return { ...result, data: result.data[0] };
			}
			const error: DataNotFoundError = new Error(
				"Question not found"
			) as DataNotFoundError;
			error.errorType = "DataNotFoundError";
			return {
				success: false,
				error,
				businessMessage: "No record found",
				statusCode: HttpStatusCode.NOT_FOUND,
			};
		} catch (error: any) {
			return {
				error,
				businessMessage: "Error fetching question",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				success: false,
			};
		}
	}
}

export { QuestionRepository };
