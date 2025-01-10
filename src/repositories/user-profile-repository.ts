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
import { UserSearchOptions } from "../types/zod/user-entity";
import { isDateRange, isNumberRange } from "../types/zod/range-entities";

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

    private fetchUserFieldsFromUserProfieFields(userProfileFields: Partial<UserProfileSearchOptions>): Partial<UserSearchOptions> {
        const userCols: string[] = ['firstName', 'lastName', 'email', 'status', 'role'];
        const userFields: { [key: string]: any } = {};
        userCols.forEach((col: string) => {
            if(userProfileFields[col as keyof UserProfileSearchOptions]) {
                userFields[col] = userProfileFields[col as keyof UserProfileSearchOptions];
                delete userProfileFields[col as keyof UserProfileSearchOptions];
            }
        });
        return userFields as Partial<UserSearchOptions>;
    }

    // Find By General Params
    async findByParams(
        userProfileFields: Partial<UserProfileSearchOptions>,
        userProfileSearchParams: UserProfileSearchParams
    ): Promise<GeneralAppResponse<UserProfileWithRelatedData[]>> {
        try {

            const userProfileTableAlias = 'p';
            const userTableAlias = 'u';
            const educationTableAlias = 'e';
            const experienceTableAlias = 'ex';

            // Fetch User Table Fields from userProfileFields and delete them from userProfileFields
            // This will also delete the user fields from userProfileFields
            const userFields = this.fetchUserFieldsFromUserProfieFields(userProfileFields);

            const userProfileSearchQueryFields: QueryFields = this.createSearchFields(userProfileFields, userProfileTableAlias);
            const userSearchQueryFields: QueryFields = this.createSearchFields(userFields, userTableAlias, DbTable.USERS);
            const searchQueryFields: QueryFields = { ...userProfileSearchQueryFields, ...userSearchQueryFields };
    
            const joins: JoinClause[] = [];
            const selectFieldsAndAlias: { field: string; alias?: string }[] = [
                { field: `${userProfileTableAlias}.*` },
            ];

            let groupByFields: string[] = [`${userProfileTableAlias}.id`];
    
            if (userProfileSearchParams.isShowUserData || Object.keys(userFields).length > 0) {
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
                    { field: `json_agg(DISTINCT ${educationTableAlias}.*)`, alias: 'education_data' }
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
                    { field: `json_agg(DISTINCT ${experienceTableAlias}.*)`, alias: 'experience_data' }
                );
            }
    
            let offset = 0;
            if (userProfileSearchParams.page && userProfileSearchParams.limit) {
                offset = (userProfileSearchParams.page - 1) * userProfileSearchParams.limit;
            }

            // Order by
            userProfileSearchParams.orderBy = SchemaMapper.toDbField(DbTable.USER_PROFILES, userProfileSearchParams.orderBy);
            // first name
            if(userProfileSearchParams.orderBy === 'firstName') {
                userProfileSearchParams.orderBy = `${userTableAlias}.first_name`;
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
                let { education_data, experience_data, user_first_name, user_last_name, user_email, ...profileFields } = row;
                education_data = education_data.length > 0 && education_data[0] !== null ? education_data : [];
                experience_data = experience_data.length > 0 && experience_data[0] !== null ? experience_data : [];
        
                // Map the data to the entity
                education_data = education_data.map((row: any) => SchemaMapper.toEntity(DbTable.USER_EDUCATION, row));
                experience_data = experience_data.map((row: any) => SchemaMapper.toEntity(DbTable.USER_EXPERIENCES, row));

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
            console.error(error);
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
            return await this.executeQuery<UserProfile>(query, params, client);
    }

    private createSearchFields(userProfileFields: Partial<UserProfileSearchOptions>, tableAlias?: string, table: DbTable = DbTable.USER_PROFILES): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(userProfileFields).forEach(([key, value]) => {
            
            if(key.includes('Range')) {
                key = key.replace('Range', '');
            }
            let keyToUse = SchemaMapper.toDbField(table, key);
            if(tableAlias) keyToUse = `${tableAlias}.${keyToUse}`;
            let operation: QueryOperation;
            let valueToUse: any = value;

            if(value === null) 
            {
                operation = QueryOperation.IS_NULL;
            }
            else if(key === 'id' || key === 'userId')
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
            else if (isEnumField(table, key))
            {
                operation = QueryOperation.EQUALS;
            }
            else if(Array.isArray(value))
            {
                operation = QueryOperation.ARRAY_INTERSECTS;
                // Check if the array is empty -> Do not add the field to the queryFields object
                if(value.length === 0) return;
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

export { UserProfileRepository };
