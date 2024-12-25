import { PoolClient } from "pg";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import { GeneralAppResponse } from "../types/response/general-app-response";
import { QuestionType } from "../types/zod/question-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder } from "./query-builder/query-builder";

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
}

export { QuestionRepository };
