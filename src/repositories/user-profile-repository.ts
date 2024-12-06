import { PoolClient } from "pg";
import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { UserProfile, UserProfileSearchOptions, UserProfileType } from "../types/zod/user-profile-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";

class UserProfileRepository extends BaseRepository {

    constructor() {
        super(DbTable.USER_PROFILES);
    }

    // Create a new User Profile
    async create(userProfileData: UserProfileType, client?: PoolClient): Promise<GeneralAppResponse<UserProfile>> {
        try {
            const userProfileFields = SchemaMapper.toDbSchema(DbTable.USER_PROFILES, userProfileData);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.USER_PROFILES, userProfileFields);
            const response: GeneralAppResponse<UserProfile[]> = await this.executeQuery<UserProfile>(query, params, client);
            // If the response is a failure response, directly return
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }
            // If the response is a success response, return the first element of the output array
            // SuccessResponse<UserProfile[]> -> SuccessResponse<UserProfile> is required hence converting the response
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
    async findByParams(userProfileFields: Partial<UserProfileSearchOptions>): Promise<GeneralAppResponse<UserProfile[]>> {
        try {
            // Build the QueryFields object
            const searchQueryFields: QueryFields = this.createSearchFields(userProfileFields);
            const { query, params } = QueryBuilder.buildSelectQuery(DbTable.USER_PROFILES, searchQueryFields);
            return await this.executeQuery<UserProfile>(query, params);
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

    async updateByParams(userProfileFields: Partial<UserProfileSearchOptions>,
        userProfileUpdatedFields: Partial<UserProfileType>,
        client?: PoolClient
    ): Promise<GeneralAppResponse<UserProfile[]>> {
            // Build the QueryFields object
            const searchQueryFields: QueryFields = this.createSearchFields(userProfileFields);
            // Prepare the update fields
            const updateFields = SchemaMapper.toDbSchema(DbTable.USER_PROFILES, userProfileUpdatedFields);
            // Build the query
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.USER_PROFILES, updateFields, searchQueryFields);
            // Execute the query
            return await this.executeQuery<UserProfile>(query, params);
    }

    private createSearchFields(userProfileFields: Partial<UserProfileSearchOptions>): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(userProfileFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            if(value === null) 
            {
                operation = QueryOperation.IS_NULL;
            }
            else if(key === 'id' || key === 'userId')
            {
                operation = QueryOperation.EQUALS;
            }
            else if (isEnumField(this.tableName, key)) 
            {
                operation = QueryOperation.EQUALS;
            }
            else if (typeof value === 'string')
            {
                operation = QueryOperation.ILIKE;
            } 
            else 
            {
                operation = QueryOperation.EQUALS;
            }
            const keyToUse = SchemaMapper.toDbField(DbTable.USER_PROFILES, key);
            // Add the field to the queryFields object
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }

}

export { UserProfileRepository };
