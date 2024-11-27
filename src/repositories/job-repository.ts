import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { Job, JobSearchOptions, JobType } from "../types/zod/job-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";

class JobRepository extends BaseRepository {

    constructor() {
        super(DbTable.JOBS);
    }

    // Create a new Job
    async create(job: JobType): Promise<GeneralAppResponse<Job>> {
        try {
            const jobDbFields = SchemaMapper.toDbSchema(DbTable.JOBS, job);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.JOBS, jobDbFields);
            const response: GeneralAppResponse<Job[]> = await this.executeQuery<Job>(query, params);
            // If the response is a failure response, directly return
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }
            // If the response is a success response, return the first element of the output array
            // SuccessResponse<Job[]> -> SuccessResponse<Job> is required hence converting the response
            return { data: response.data[0], success: true };
        }
        catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    // Find By General Params
    async findByParams(jobFields: Partial<JobSearchOptions>): Promise<GeneralAppResponse<Job[]>> {
        try {
            // Build the QueryFields object
            const queryFields: QueryFields = {};
            Object.entries(jobFields).forEach(([key, value]) => {
                
                let operation: QueryOperation;
                if(value === null) {
                    operation = QueryOperation.IS_NULL;
                } else if (typeof value === 'string' && key !== 'id') {
                    operation = QueryOperation.ILIKE;
                } else if (Array.isArray(value)) {
                    // Check if there is intersection between db array and the search array
                    operation = QueryOperation.ARRAY_INTERSECTS;
                }
                else {
                    operation = QueryOperation.EQUALS;
                }
                const keyToUse = SchemaMapper.toDbField(DbTable.JOBS, key);
                // Add the field to the queryFields object
                queryFields[keyToUse] = { value, operation };
            });

            const { query, params } = QueryBuilder.buildSelectQuery(DbTable.JOBS, queryFields);
            return await this.executeQuery<Job>(query, params);
        }
        catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    async updateByParams(jobSearchFields: Partial<JobSearchOptions>, jobUpdateFields: Partial<JobType>): Promise<GeneralAppResponse<Job[]>> {
            // Build the QueryFields object
            const searchQueryFields: QueryFields = {};
            Object.entries(jobSearchFields).forEach(([key, value]) => {
                let operation: QueryOperation;
                if(value === null) {
                    operation = QueryOperation.IS_NULL;
                } else if (isEnumField(this.tableName, key)) {
                    operation = QueryOperation.EQUALS;
                } else if (typeof value === 'string' && key !== 'id') {
                    operation = QueryOperation.ILIKE;
                } else if (Array.isArray(value)) {
                    // Check if there is intersection between db array and the search array
                    operation = QueryOperation.ARRAY_INTERSECTS;
                } else {
                    operation = QueryOperation.EQUALS;
                }
                const keyToUse = SchemaMapper.toDbField(DbTable.JOBS, key);
                // Add the field to the queryFields object
                searchQueryFields[keyToUse] = { value, operation };
            });

            // Prepare the update fields
            const updateFields = SchemaMapper.toDbSchema(DbTable.JOBS, jobUpdateFields);

            // Build the query
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.JOBS, updateFields, searchQueryFields);
            // Execute the query
            return await this.executeQuery<Job>(query, params);
    }

}

export { JobRepository };
