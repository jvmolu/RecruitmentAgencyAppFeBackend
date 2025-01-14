import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import {InterviewSearchOptions, InterviewSearchParams, InterviewType, InterviewWithRelatedData} from "../types/zod/interview-entity";
import HttpStatusCode from "../types/enums/http-status-codes";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { PoolClient } from "pg";
import { DatabaseError } from "../types/error/database-error";
import QueryOperation from "../types/enums/query-operation";
import { isEnumField } from "../types/enum-field-mapping";
import { isDateRange, isNumberRange } from "../types/zod/range-entities";
import { JoinClause, JoinType } from "../types/enums/join-type";

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

	async findByParams(
		interviewFields: Partial<InterviewSearchOptions>,
		interviewSearchParams: InterviewSearchParams,
		client?: PoolClient): Promise<GeneralAppResponse<InterviewWithRelatedData[]>> {
		try {

			const interviewTableAlias = 'i';
			const applicationTableAlias = 'a';
			const jobTableAlias = 'j';
			const interviewQuestionTableAlias = 'iq';

			const searchQueryFields = this.createSearchFields(interviewFields, interviewTableAlias);

			const joins: JoinClause[] = [];
			const selectFieldsAndAlias: {field: string, alias?: string}[] = [
				{ field: `${interviewTableAlias}.*` },
			];

			const groupByFields: string[] = [`${interviewTableAlias}.id`];

			if(interviewSearchParams.isShowQuestions) {
				joins.push({
					joinType: JoinType.LEFT,
					tableName: DbTable.INTERVIEW_QUESTIONS,
					alias: interviewQuestionTableAlias,
					onCondition: `${interviewTableAlias}.id = ${interviewQuestionTableAlias}.interview_id`,
				});
				selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${interviewQuestionTableAlias}.*)`, alias: 'questions' });
			}

			if(interviewSearchParams.isShowJobData) {
				joins.push({
					joinType: JoinType.LEFT,
					tableName: DbTable.JOBS,
					alias: jobTableAlias,
					onCondition: `${interviewTableAlias}.job_id = ${jobTableAlias}.id`,
				});
				selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${jobTableAlias}.*)`, alias: 'job_data' });
			}

			if(interviewSearchParams.isShowApplicationData) {
				joins.push({
					joinType: JoinType.LEFT,
					tableName: DbTable.APPLICATIONS,
					alias: applicationTableAlias,
					onCondition: `${interviewTableAlias}.application_id = ${applicationTableAlias}.id`,
				});
				selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${applicationTableAlias}.*)`, alias: 'application_data' });
			}

			let offset = 0;
    	    if (interviewSearchParams.page && interviewSearchParams.limit) {
        		offset = (interviewSearchParams.page - 1) * interviewSearchParams.limit;
          	}

			// Order by
	        interviewSearchParams.orderBy = SchemaMapper.toDbField(DbTable.INTERVIEWS, interviewSearchParams.orderBy);

			const { query, params } = QueryBuilder.buildSelectQuery(
				DbTable.INTERVIEWS,
				searchQueryFields,
				interviewTableAlias,
				selectFieldsAndAlias,
				joins,
				groupByFields,
				interviewSearchParams.limit,
				offset,
				interviewSearchParams.orderBy,
				interviewSearchParams.order
			  );
			
			const result = await this.executeQuery<any>(query, params,client);
			if(isGeneralAppFailureResponse(result)) {
				return result;
			}

			const data: InterviewWithRelatedData[] = result.data.map((row) => {

	            let { job_data, application_data, questions, ...interviewData } = row;

				job_data = job_data && job_data.length > 0 && job_data[0] !== null ? job_data[0] : [];
				application_data = application_data && application_data.length > 0 && application_data[0] !== null ? application_data[0] : [];
				questions = questions && questions.length > 0 ? questions : [];

				job_data = SchemaMapper.toEntity(DbTable.JOBS, job_data);
				application_data = SchemaMapper.toEntity(DbTable.APPLICATIONS, application_data);
				questions = questions.map((q: any) => SchemaMapper.toEntity(DbTable.INTERVIEW_QUESTIONS, q));

				return {
					...interviewData,
					job: interviewSearchParams.isShowJobData ? job_data : undefined,
					application: interviewSearchParams.isShowApplicationData ? application_data : undefined,
					questions: interviewSearchParams.isShowQuestions ? questions : undefined
				};
			});

			return {
				success: true,
				data: data
			};

		} catch (error: any) {
			return {
				error,
				businessMessage: 'Internal server error',
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
}
