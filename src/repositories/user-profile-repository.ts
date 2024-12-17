import { PoolClient } from "pg";
import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { UserProfile, UserProfileSearchOptions, UserProfileSearchParams, UserProfileType, UserProfileWithRelatedData } from "../types/zod/user-profile-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { JoinClause, JoinType } from "../types/enums/join-type";

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
    async findByParams(
        userProfileFields: Partial<UserProfileSearchOptions>,
        userProfileSearchParams: UserProfileSearchParams
    ): Promise<GeneralAppResponse<UserProfileWithRelatedData[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(userProfileFields);
            const userProfileTableAlias = 'p';
            const userTableAlias = 'u';
            const educationTableAlias = 'e';
            const experienceTableAlias = 'ex';
    
            const joins: JoinClause[] = [];
            const selectFieldsAndAlias: { field: string; alias?: string }[] = [
                { field: `${userProfileTableAlias}.*` },
            ];

            let groupByFields: string[] = [`${userProfileTableAlias}.id`];
    
            if (userProfileSearchParams.isShowUserData) {
                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.USERS,
                    alias: userTableAlias,
                    onCondition: `${userProfileTableAlias}.user_id = ${userTableAlias}.id`,
                });
                selectFieldsAndAlias.push(
                    { field: `${userTableAlias}.first_name`, alias: 'user_first_name' },
                    { field: `${userTableAlias}.last_name`, alias: 'user_last_name' },
                    { field: `${userTableAlias}.email`, alias: 'user_email' }
                );
                groupByFields.push(`${userTableAlias}.first_name`, `${userTableAlias}.last_name`, `${userTableAlias}.email`);
            }
    
            if (userProfileSearchParams.isShowUserEducationData) {
                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.USER_EDUCATION,
                    alias: educationTableAlias,
                    onCondition: `${userProfileTableAlias}.id = ${educationTableAlias}.user_profile_id`,
                });
                selectFieldsAndAlias.push(
                    { field: `json_agg(${educationTableAlias}.*)`, alias: 'education_data' }
                );
            }
    
            if (userProfileSearchParams.isShowUserExperienceData) {
                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.USER_EXPERIENCES,
                    alias: experienceTableAlias,
                    onCondition: `${userProfileTableAlias}.id = ${experienceTableAlias}.user_profile_id`,
                });
                selectFieldsAndAlias.push(
                    { field: `json_agg(${experienceTableAlias}.*)`, alias: 'experience_data' }
                );
            }
    
            let offset = 0;
            if (userProfileSearchParams.page && userProfileSearchParams.limit) {
                offset = (userProfileSearchParams.page - 1) * userProfileSearchParams.limit;
            }
    
            const { query, params } = QueryBuilder.buildSelectQuery(
                DbTable.USER_PROFILES,
                searchQueryFields,
                userProfileTableAlias,
                selectFieldsAndAlias,
                joins,
                groupByFields,
                userProfileSearchParams.limit,
                offset,
                userProfileSearchParams.orderBy,
                userProfileSearchParams.order
            );
    
            const response: GeneralAppResponse<any[]> = await this.executeQuery<any>(query, params);
    
            if (isGeneralAppFailureResponse(response)) {
                return response;
            }
    
            const data: UserProfileWithRelatedData[] = response.data.map((row) => {
                const { education_data, experience_data, user_first_name, user_last_name, user_email, ...profileFields } = row;
                return {
                    ...profileFields,
                    user: userProfileSearchParams.isShowUserData ? {
                        firstName: user_first_name,
                        lastName: user_last_name,
                        email: user_email
                    } : undefined,
                    education: userProfileSearchParams.isShowUserEducationData ? education_data : undefined,
                    experience: userProfileSearchParams.isShowUserExperienceData ? experience_data : undefined,
                };
            });
    
            return { success: true, data };
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false,
            };
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
