import { BaseRepository } from "./base-repository";
import { QueryBuilder } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { GeneralAppResponse } from "../types/response/general-app-response";
import {
	InterviewQuestionType,
	InterviewType,
} from "../types/zod/interview-entity";
import HttpStatusCode from "../types/enums/http-status-codes";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { v4 as uuidv4 } from "uuid";
import { PoolClient } from "pg";
import { DatabaseError } from "../types/error/database-error";
import QueryOperation from "../types/enums/query-operation";

export class InterviewRepository extends BaseRepository {
	constructor() {
		super(DbTable.INTERVIEWS);
	}

	async createInterview(
		data: Omit<InterviewType, "id" | "createdAt" | "updatedAt">,
		client?: PoolClient
	): Promise<GeneralAppResponse<InterviewType>> {
		try {
			const interviewData = {
				id: uuidv4(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				...data,
			};
			const dbFields = SchemaMapper.toDbSchema(
				DbTable.INTERVIEWS,
				interviewData
			);
			const { query, params } = QueryBuilder.buildInsertQuery(
				this.tableName,
				dbFields
			);
			const result = await this.executeQuery<InterviewType>(
				query,
				params,
				client
			);

			if (result.success) {
				return {
					success: true,
					data: result.data[0],
				};
			}
			return result;
		} catch (error: any) {
			const dbError: DatabaseError = error as DatabaseError;
			dbError.errorType = "DatabaseError";
			return {
				error: dbError,
				businessMessage: "Error creating interview",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				success: false,
			};
		}
	}

	async createInterviewQuestions(
		questions: Omit<InterviewQuestionType, "id" | "createdAt" | "updatedAt">[],
		client?: PoolClient
	): Promise<GeneralAppResponse<InterviewQuestionType[]>> {
		try {
			const questionsData = questions.map((q) => ({
				id: uuidv4(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				...q,
			}));
			const dbFields = questionsData.map((q) =>
				SchemaMapper.toDbSchema(DbTable.INTERVIEW_QUESTIONS, q)
			);
			const { query, params } = QueryBuilder.buildBulkInsertQuery(
				DbTable.INTERVIEW_QUESTIONS,
				dbFields
			);
			return await this.executeQuery<InterviewQuestionType>(
				query,
				params,
				client
			);
		} catch (error: any) {
			const dbError: DatabaseError = error as DatabaseError;
			dbError.errorType = "DatabaseError";
			return {
				error: dbError,
				businessMessage: "Error creating interview questions",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				success: false,
			};
		}
	}

	async getMaxSequenceNumber(
		interviewId: string
	): Promise<GeneralAppResponse<{ max: number }>> {
		try {
			const query = `
				SELECT MAX(sequence_number) as max 
				FROM ${DbTable.INTERVIEW_QUESTIONS}
				WHERE interview_id = $1
			`;
			const result = await this.executeQuery<{ max: number }>(query, [
				interviewId,
			]);

			if (!result.success) {
				return result;
			}

			return {
				success: true,
				data: {
					max: result.data[0]?.max || 0,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error as DatabaseError,
				businessMessage: "Error getting max sequence number",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}

	async createInterviewQuestion(
		question: Omit<InterviewQuestionType, "id" | "createdAt" | "updatedAt">
	): Promise<GeneralAppResponse<InterviewQuestionType>> {
		try {
			const questionData = {
				id: uuidv4(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				...question,
			};

			const dbFields = SchemaMapper.toDbSchema(
				DbTable.INTERVIEW_QUESTIONS,
				questionData
			);

			const { query, params } = QueryBuilder.buildInsertQuery(
				DbTable.INTERVIEW_QUESTIONS,
				dbFields
			);

			const result = await this.executeQuery<InterviewQuestionType>(
				query,
				params
			);

			if (!result.success) {
				return result;
			}

			// Return first item from array
			return {
				success: true,
				data: result.data[0],
			};
		} catch (error) {
			return {
				success: false,
				error: error as DatabaseError,
				businessMessage: "Error creating interview question",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}

	async findOne(id: string): Promise<GeneralAppResponse<InterviewType>> {
		try {
			const { query, params } = QueryBuilder.buildSelectQuery(this.tableName, {
				id: { value: id, operation: QueryOperation.EQUALS },
			});

			const result = await this.executeQuery<InterviewType>(query, params);

			if (!result.success) {
				return result;
			}

			if (result.data.length === 0) {
				return {
					success: false,
					error: new Error("Interview not found") as DatabaseError,
					businessMessage: "Interview not found",
					statusCode: HttpStatusCode.NOT_FOUND,
				};
			}

			return {
				success: true,
				data: result.data[0],
			};
		} catch (error) {
			return {
				success: false,
				error: error as DatabaseError,
				businessMessage: "Error finding interview",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}
}
