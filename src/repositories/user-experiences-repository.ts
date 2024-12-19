import { PoolClient } from "pg";
import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { UserExperience, UserExperienceSearchOptions, UserExperienceType } from "../types/zod/user-experience-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";

class UserExperienceRepository extends BaseRepository {

    constructor() {
        super(DbTable.USER_EXPERIENCES);
    }

    // Create a new User Experience
    async create(userExperienceData: UserExperienceType): Promise<GeneralAppResponse<UserExperience>> {
        try {
            const userExperienceFields = SchemaMapper.toDbSchema(DbTable.USER_EXPERIENCES, userExperienceData);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.USER_EXPERIENCES, userExperienceFields);
            const response: GeneralAppResponse<UserExperience[]> = await this.executeQuery<UserExperience>(query, params);
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

    // Create multiple User Experience records
    async createBulk(userExperienceData: UserExperienceType[], client?: PoolClient): Promise<GeneralAppResponse<UserExperienceType[]>> {
        try {
            const userExperienceFields = userExperienceData.map(data => SchemaMapper.toDbSchema(DbTable.USER_EXPERIENCES, data));
            if(userExperienceFields.length === 0) {
                return {
                    data: [],
                    success: true
                };
            }
            const { query, params } = QueryBuilder.buildBulkInsertQuery(DbTable.USER_EXPERIENCES, userExperienceFields);
            const response: GeneralAppResponse<UserExperienceType[]> = await this.executeQuery<UserExperienceType>(query, params, client);
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
    async findByParams(userExperienceFields: Partial<UserExperienceSearchOptions>): Promise<GeneralAppResponse<UserExperience[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(userExperienceFields);
            const { query, params } = QueryBuilder.buildSelectQuery(DbTable.USER_EXPERIENCES, searchQueryFields);
            return await this.executeQuery<UserExperience>(query, params);
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
    async updateByParams(userExperienceFields: Partial<UserExperienceSearchOptions>,
        userExperienceUpdatedFields: Partial<UserExperienceType>,
        client?: PoolClient
    ): Promise<GeneralAppResponse<UserExperience[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(userExperienceFields);
            const updateFields = SchemaMapper.toDbSchema(DbTable.USER_EXPERIENCES, userExperienceUpdatedFields);
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.USER_EXPERIENCES, updateFields, searchQueryFields);
            return await this.executeQuery<UserExperience>(query, params, client);
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }

    async deleteByParams(userExperienceFields: Partial<UserExperienceSearchOptions>, client?: PoolClient): Promise<GeneralAppResponse<UserExperience[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(userExperienceFields);
            const { query, params } = QueryBuilder.buildDeleteQuery(DbTable.USER_EXPERIENCES, searchQueryFields);
            return await this.executeQuery<UserExperience>(query, params, client);
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }

    private createSearchFields(userExperienceFields: Partial<UserExperienceSearchOptions>): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(userExperienceFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            let keyToUse = SchemaMapper.toDbField(DbTable.USER_EXPERIENCES, key);
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

export { UserExperienceRepository };