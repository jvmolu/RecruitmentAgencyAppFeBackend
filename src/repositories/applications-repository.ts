import { PoolClient } from "pg";
import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { Application, ApplicationSearchOptions, ApplicationType } from "../types/zod/application-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";

class ApplicationRepository extends BaseRepository {
    constructor() {
        super(DbTable.APPLICATIONS);
    }

    /**
     * Create a new application
     */
    async create(application: ApplicationType): Promise<GeneralAppResponse<Application>> {
        try {
            const applicationDbFields = SchemaMapper.toDbSchema(DbTable.APPLICATIONS, application);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.APPLICATIONS, applicationDbFields);
            const response: GeneralAppResponse<Application[]> = await this.executeQuery<Application>(query, params);
            
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }

            return { data: response.data[0], success: true };
        } catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    /**
     * Find applications by parameters
     */
    async findByParams(applicationFields: Partial<ApplicationSearchOptions>): Promise<GeneralAppResponse<Application[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(applicationFields);
            const { query, params } = QueryBuilder.buildSelectQuery(DbTable.APPLICATIONS, searchQueryFields);
            return await this.executeQuery<Application>(query, params);
        } catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    /**
     * Update applications by parameters
     */
    async updateByParams(
        applicationSearchFields: Partial<ApplicationSearchOptions>,
        applicationUpdateFields: Partial<ApplicationType>,
        client?: PoolClient
    ): Promise<GeneralAppResponse<Application[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(applicationSearchFields);
            const updateFields = SchemaMapper.toDbSchema(DbTable.APPLICATIONS, applicationUpdateFields);
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.APPLICATIONS, updateFields, searchQueryFields);
            return await this.executeQuery<Application>(query, params, client);
        } catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    /**
     * Create search fields for query building
    **/
    private createSearchFields(applicationFields: Partial<ApplicationSearchOptions>): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(applicationFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            if(value === null) {
                operation = QueryOperation.IS_NULL;
            } else if(key === 'id' || key === 'candidateId' || key === 'jobId' || key === 'inviteId') {
                operation = QueryOperation.EQUALS;
            } else if (isEnumField(this.tableName, key)) {
                operation = QueryOperation.EQUALS;
            } else if (typeof value === 'string') {
                operation = QueryOperation.ILIKE;
            } else {
                operation = QueryOperation.EQUALS;
            }
            const keyToUse = SchemaMapper.toDbField(DbTable.APPLICATIONS, key);
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }
}

export { ApplicationRepository };