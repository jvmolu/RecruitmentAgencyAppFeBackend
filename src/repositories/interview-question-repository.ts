import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { PoolClient } from "pg";
import { DatabaseError } from "../types/error/database-error";
import { InterviewQuestionSearchOptions, InterviewQuestionType } from "../types/zod/interview-question";
import QueryOperation from "../types/enums/query-operation";
import { isEnumField } from "../types/enum-field-mapping";
import { isDateRange, isNumberRange } from "../types/zod/range-entities";

export class InterviewQuestionRepository extends BaseRepository {
	
	constructor() {
		super(DbTable.INTERVIEW_QUESTIONS);
	}

	async createInterviewQuestions(questionsData: InterviewQuestionType[],client?: PoolClient): Promise<GeneralAppResponse<InterviewQuestionType[]>> {
		try {
			const questionsWithDbFields = questionsData.map((q) =>
				SchemaMapper.toDbSchema(DbTable.INTERVIEW_QUESTIONS, q)
			);
			const { query, params } = QueryBuilder.buildBulkInsertQuery(DbTable.INTERVIEW_QUESTIONS,questionsWithDbFields);
			return await this.executeQuery<InterviewQuestionType>(query,params,client);
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

    async findByParams(interviewQuestionFields: Partial<InterviewQuestionSearchOptions>,client?: PoolClient): Promise<GeneralAppResponse<InterviewQuestionType[]>> {
		try {
			const queryFields = this.createSearchFields(interviewQuestionFields);
			const { query, params } = QueryBuilder.buildSelectQuery(this.tableName, queryFields);
			const result = await this.executeQuery<InterviewQuestionType>(query, params,client);
			if(isGeneralAppFailureResponse(result)) {
				return result;
			}
			return {
				success: true,
				data: result.data,
			};
		} catch (error: any) {
			const dbError: DatabaseError = error as DatabaseError;
			dbError.errorType = "DatabaseError";
			return {
				error: dbError,
				businessMessage: "Error finding interview",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				success: false,
			};
		}
	}

	async updateByParams(interviewQuestionSearchFields: Partial<InterviewQuestionSearchOptions>, interviewQuestionUpdateFields: Partial<InterviewQuestionType>,client?: PoolClient): Promise<GeneralAppResponse<InterviewQuestionType[]>> {
		try {
			const queryFields = this.createSearchFields(interviewQuestionSearchFields);
			const updateFields = SchemaMapper.toDbSchema(DbTable.INTERVIEW_QUESTIONS, interviewQuestionUpdateFields);
			const { query, params } = QueryBuilder.buildUpdateQuery(this.tableName, updateFields, queryFields);
			return await this.executeQuery<InterviewQuestionType>(query, params,client);
		} catch (error: any) {
			const dbError: DatabaseError = error as DatabaseError;
			dbError.errorType = "DatabaseError";
			return {
				error: dbError,
				businessMessage: "Error updating interview",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				success: false,
			};
		}
	}

	async updateByValues(updates: {searchFields: Partial<InterviewQuestionType>, updateFields: Partial<InterviewQuestionType>}[], client?: PoolClient): Promise<GeneralAppResponse<InterviewQuestionType[]>> {
		// User Schema Mapper to convert the data to DB schema
		const interviewQuestionUpdateFields = updates.map(u => {
			const dbSearchFields = SchemaMapper.toDbSchema(DbTable.INTERVIEW_QUESTIONS, u.searchFields);
			const dbUpdateFields = SchemaMapper.toDbSchema(DbTable.INTERVIEW_QUESTIONS, u.updateFields);

			// TODO. REMOVE THESE PARSERS, THERE SHOULD BE NO NEED FOR THIS.
			// ADD PARSER INFO FOR COLUMN TYPES
			return {
				searchFields: Object.entries(dbSearchFields).reduce((acc, [key, value]) => ({
						...acc,
						[key]: {
						value,
						parser: key === 'id' ? 'uuid' : null
					}
				}), {}),
				updateFields: Object.entries(dbUpdateFields).reduce((acc, [key, value]) => ({
						...acc,
						[key]: {
						value,
						// if updated_at then parser is timestamptz
						// if obtained_marks, then parser is integer
						// if is_checked, then parser is boolean
						parser: {
							updated_at: 'timestamptz',
							obtained_marks: 'integer',
							is_checked: 'boolean'
						}[key] || null
					}
				}), {})
			};
		});

		// ADD PARSER INFO
		const { query, params } = QueryBuilder.buildUpdateQueryViaValue(DbTable.INTERVIEW_QUESTIONS, interviewQuestionUpdateFields);
		return await this.executeQuery<InterviewQuestionType>(query, params, client);
	}

	private createSearchFields(interviewFields: Partial<InterviewQuestionSearchOptions>, tableAlias?: string): QueryFields {

		const queryFields: QueryFields = {};

		Object.entries(interviewFields).forEach(([key, value]) => {

			if(key.includes('Range')) {
                key = key.replace('Range', '');
            }

			let keyToUse = SchemaMapper.toDbField(DbTable.INTERVIEW_QUESTIONS, key);
            if(tableAlias) keyToUse = `${tableAlias}.${keyToUse}`;

            let operation: QueryOperation;
            let valueToUse: any = value;

            if(value === null) 
            {
                operation = QueryOperation.IS_NULL;
            }
            else if(key === 'id' || key === 'jobId' || key === 'candidateId' || key === 'applicationId')
            {
                operation = QueryOperation.EQUALS;
            }
            else if (isEnumField(this.tableName, key)) 
            {
                operation = QueryOperation.EQUALS;
            }
            else if (isNumberRange(value) || isDateRange(value))
            {
               // value is like: { min: 10, max: 20 }
               // need to use queryOperation based on if we have both min and max or only one of them
               // value needs to be an array of two elements or a single element
               const { min, max } = value;

               if(min !== undefined && max !== undefined) 
               {
                  operation = QueryOperation.BETWEEN;
                  valueToUse = [min, max];
               }
               else if(min !== undefined) 
               {
                  operation = QueryOperation.GREATER_THAN_EQUALS;
                  valueToUse = min;
               }
               else if(max !== undefined)
               {
                  operation = QueryOperation.LESS_THAN_EQUALS;
                  valueToUse = max;
               }
               else 
               {
                 // INVALID RANGE
                 return;
               }
            }
            else if (typeof value === 'string')
            {
                operation = QueryOperation.ILIKE;
            } 
            else 
            {
                operation = QueryOperation.EQUALS;
            }
            // Add the field to the queryFields object
            queryFields[keyToUse] = { value:valueToUse, operation };
        });
        return queryFields;
    }
}
