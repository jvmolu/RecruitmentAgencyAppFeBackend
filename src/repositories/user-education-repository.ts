import { PoolClient } from "pg";
import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { UserEducation, UserEducationSearchOptions, UserEducationType } from "../types/zod/user-education-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";

class UserEducationRepository extends BaseRepository {

    constructor() {
        super(DbTable.USER_EDUCATION);
    }

    // Create a new User Education
    async create(userEducationData: UserEducationType): Promise<GeneralAppResponse<UserEducation>> {
        try {
            const userEducationFields = SchemaMapper.toDbSchema(DbTable.USER_EDUCATION, userEducationData);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.USER_EDUCATION, userEducationFields);
            const response: GeneralAppResponse<UserEducation[]> = await this.executeQuery<UserEducation>(query, params);
            if (isGeneralAppFailureResponse(response)) {
                return response;
            }
            return { data: response.data[0], success: true };
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }

    // Create multiple User Education records
    async createBulk(userEducationData: UserEducationType[], client?: PoolClient): Promise<GeneralAppResponse<UserEducationType[]>> {
        try {
            const userEducationFields = userEducationData.map(data => SchemaMapper.toDbSchema(DbTable.USER_EDUCATION, data));
            if(userEducationFields.length === 0) {
                return {
                    data: [],
                    success: true
                };
            }
            const { query, params } = QueryBuilder.buildBulkInsertQuery(DbTable.USER_EDUCATION, userEducationFields);
            const response: GeneralAppResponse<UserEducationType[]> = await this.executeQuery<UserEducationType>(query, params, client);
            if (isGeneralAppFailureResponse(response)) {
                return response;
            }
            return { data: response.data, success: true };
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }

    // Find by parameters
    async findByParams(userEducationFields: Partial<UserEducationSearchOptions>): Promise<GeneralAppResponse<UserEducation[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(userEducationFields);
            const { query, params } = QueryBuilder.buildSelectQuery(DbTable.USER_EDUCATION, searchQueryFields);
            return await this.executeQuery<UserEducation>(query, params);
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }

    // Update by parameters
    async updateByParams(userEducationFields: Partial<UserEducationSearchOptions>,
        userEducationUpdatedFields: Partial<UserEducationType>,
        client?: PoolClient
    ): Promise<GeneralAppResponse<UserEducation[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(userEducationFields);
            const updateFields = SchemaMapper.toDbSchema(DbTable.USER_EDUCATION, userEducationUpdatedFields);
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.USER_EDUCATION, updateFields, searchQueryFields);
            return await this.executeQuery<UserEducation>(query, params, client);
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }

    
    // Delete by parameters
    async deleteByParams(userEducationFields: Partial<UserEducationSearchOptions>, client?: PoolClient): Promise<GeneralAppResponse<UserEducation[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(userEducationFields);
            const { query, params } = QueryBuilder.buildDeleteQuery(DbTable.USER_EDUCATION, searchQueryFields);
            return await this.executeQuery<UserEducation>(query, params, client);
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }


    private createSearchFields(userEducationFields: Partial<UserEducationSearchOptions>): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(userEducationFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            let keyToUse = SchemaMapper.toDbField(DbTable.USER_EDUCATION, key);
            if (value === null) {
                operation = QueryOperation.IS_NULL;
            } else if(key == 'idNotIn') {
                keyToUse = 'id';
                operation = QueryOperation.NOT_IN;
                // Value will be an array
                if(Array.isArray(value) && value.length == 0) {
                    // Add a dummy value to prevent SQL syntax error
                    value.push('00000000-0000-0000-0000-000000000000');
                }
            } else if (key === 'id' || key === 'userProfileId') {
                operation = QueryOperation.EQUALS;
            } else if (isEnumField(this.tableName, key)) {
                operation = QueryOperation.EQUALS;
            } else if (typeof value === 'string') {
                operation = QueryOperation.ILIKE;
            } else {
                operation = QueryOperation.EQUALS;
            }
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }

}

export { UserEducationRepository };