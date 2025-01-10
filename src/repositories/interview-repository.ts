import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import {InterviewSearchOptions, InterviewType} from "../types/zod/interview-entity";
import HttpStatusCode from "../types/enums/http-status-codes";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { PoolClient } from "pg";
import { DatabaseError } from "../types/error/database-error";
import QueryOperation from "../types/enums/query-operation";
import { isEnumField } from "../types/enum-field-mapping";
import { isDateRange, isNumberRange } from "../types/zod/range-entities";

export class InterviewRepository extends BaseRepository {
	
	constructor() {
		super(DbTable.INTERVIEWS);
	}

	async createInterview(interviewData: InterviewType,client?: PoolClient): Promise<GeneralAppResponse<InterviewType>> {
		try {
			const dbFields = SchemaMapper.toDbSchema(DbTable.INTERVIEWS,interviewData);
			const { query, params } = QueryBuilder.buildInsertQuery(this.tableName,dbFields);
			const result = await this.executeQuery<InterviewType>(query,params,client);
			if(isGeneralAppFailureResponse(result)) {
				return result;
			}
			return {
				success: true,
				data: result.data[0],
			};
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

	async findByParams(interviewFields: Partial<InterviewSearchOptions>,client?: PoolClient): Promise<GeneralAppResponse<InterviewType[]>> {
		try {
			const queryFields = this.createSearchFields(interviewFields);
			const { query, params } = QueryBuilder.buildSelectQuery(this.tableName, queryFields);
			const result = await this.executeQuery<InterviewType>(query, params,client);
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

	async updateByParams(interviewSearchFields: Partial<InterviewSearchOptions>, interviewUpdateFields: Partial<InterviewType>,client?: PoolClient): Promise<GeneralAppResponse<InterviewType[]>> {
		try {
			const queryFields = this.createSearchFields(interviewSearchFields);
			const updateFields = SchemaMapper.toDbSchema(DbTable.INTERVIEWS, interviewUpdateFields);
			const { query, params } = QueryBuilder.buildUpdateQuery(this.tableName, updateFields, queryFields);
			const result = await this.executeQuery<InterviewType>(query, params,client);
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
				businessMessage: "Error updating interview",
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				success: false,
			};
		}
	}

	private createSearchFields(interviewFields: Partial<InterviewSearchOptions>, tableAlias?: string): QueryFields {

		const queryFields: QueryFields = {};

		Object.entries(interviewFields).forEach(([key, value]) => {

			if(key.includes('Range')) {
                key = key.replace('Range', '');
            }

			let keyToUse = SchemaMapper.toDbField(DbTable.INTERVIEWS, key);
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

	// async getMaxSequenceNumber(interviewId: string): Promise<GeneralAppResponse<{ max: number }>> {
	// 	try {
	// 		const query = `
	// 			SELECT MAX(sequence_number) as max 
	// 			FROM ${DbTable.INTERVIEW_QUESTIONS}
	// 			WHERE interview_id = $1
	// 		`;
	// 		const result = await this.executeQuery<{ max: number }>(query, [
	// 			interviewId,
	// 		]);
	// 		if (isGeneralAppFailureResponse(result)) {
	// 			return result;
	// 		}
	// 		return {
	// 			success: true,
	// 			data: {
	// 				max: result.data[0]?.max || 0,
	// 			},
	// 		};
	// 	} catch (error) {
	// 		return {
	// 			success: false,
	// 			error: error as DatabaseError,
	// 			businessMessage: "Error getting max sequence number",
	// 			statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
	// 		};
	// 	}
	// }

	// Find by parameters

	// Update by parameters
}
