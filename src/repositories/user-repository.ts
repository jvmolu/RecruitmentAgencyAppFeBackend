import { BaseRepository } from "./base-repository";
import { User, UserSearchOptions, UserSearchParams, UserType, UserWithProfileData } from "../types/zod/user-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import QueryOperation from "../types/enums/query-operation";
import { isEnumField } from "../types/enum-field-mapping";
import { JoinClause, JoinType } from "../types/enums/join-type";
import { SortOrder } from "../types/enums/sort-order";
import { PoolClient } from "pg";
import { UserProfile } from "../types/zod/user-profile-entity";

class UserRepository extends BaseRepository {

    constructor() {
        super(DbTable.USERS);
    }

    async create(user: UserType, client?: PoolClient): Promise<GeneralAppResponse<User>> {
        try {
            const userDbFields = SchemaMapper.toDbSchema(DbTable.USERS, user);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.USERS, userDbFields);
            const response: GeneralAppResponse<User[]> = await this.executeQuery<User>(query, params, client);
            // If the response is a failure response, directly return
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }
            // If the response is a success response, return the first element of the output array
            // SuccessResponse<User[]> -> SuccessResponse<User> is required hence converting the response
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
        userFields: Partial<UserSearchOptions>,
        userSearchParams: UserSearchParams = {limit: 1, page: 1, isShowUserProfileData: false, isShowUserEducationData: false, isShowUserExperienceData: false, orderBy: 'created_at', order:SortOrder.DESC}
      ): Promise<GeneralAppResponse<UserWithProfileData[]>> {
        try {

          const userTableAlias = 'u';
          const profileTableAlias = 'p';
          const educationTableAlias = 'e';
          const experienceTableAlias = 'ex';
          const searchQueryFields: QueryFields = this.createSearchFields(userFields, userTableAlias);
      
          const joins: JoinClause[] = [];
          let groupByFields: string[] = [];
          const selectFieldsAndAlias: { field: string; alias?: string }[] = [
            { field: `${userTableAlias}.*` },
          ];
      
          if (userSearchParams.isShowUserProfileData) {
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.USER_PROFILES,
              alias: profileTableAlias,
              onCondition: `${userTableAlias}.id = ${profileTableAlias}.user_id`,
            });
            
            selectFieldsAndAlias.push({
                field: `json_agg(DISTINCT ${profileTableAlias}.*)`, alias: 'user_profile_data',
            });

            if (userSearchParams.isShowUserEducationData) {
                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.USER_EDUCATION,
                    alias: educationTableAlias,
                    onCondition: `${profileTableAlias}.id = ${educationTableAlias}.user_profile_id`,
                });
                selectFieldsAndAlias.push(
                    { field: `json_agg(DISTINCT ${educationTableAlias}.*)`, alias: 'education_data' }
                );
            }
    
            if (userSearchParams.isShowUserExperienceData) {
                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.USER_EXPERIENCES,
                    alias: experienceTableAlias,
                    onCondition: `${profileTableAlias}.id = ${experienceTableAlias}.user_profile_id`,
                });
                selectFieldsAndAlias.push(
                    { field: `json_agg(DISTINCT ${experienceTableAlias}.*)`, alias: 'experience_data' }
                );
            }

            groupByFields.push(`${userTableAlias}.id`);
          }
      
          let offset = 0;
          if (userSearchParams.page && userSearchParams.limit) {
            offset = (userSearchParams.page - 1) * userSearchParams.limit;
          }

          // Order by
          userSearchParams.orderBy = SchemaMapper.toDbField(DbTable.USERS, userSearchParams.orderBy);

          const { query, params } = QueryBuilder.buildSelectQuery(
            DbTable.USERS,
            searchQueryFields,
            userTableAlias,
            selectFieldsAndAlias,
            joins,
            groupByFields,
            userSearchParams.limit,
            offset,
            userSearchParams.orderBy,
            userSearchParams.order
          );
      
          const response: GeneralAppResponse<any[]> = await this.executeQuery<any>(query, params);
          if (isGeneralAppFailureResponse(response)) {
            return response;
          }
      
          const data: UserWithProfileData[] = response.data.map((row) => {
            
            let { education_data, experience_data, user_profile_data, ...userFields } = row;
            
            education_data = education_data && education_data.length > 0 && education_data[0] !== null ? education_data : [];
            experience_data = experience_data && experience_data.length > 0 && experience_data[0] !== null ? experience_data : [];
            user_profile_data = user_profile_data && user_profile_data.length > 0 && user_profile_data[0] !== null ? user_profile_data[0] : [];

            // Use Schema Mapper to convert the fields to the entity
            user_profile_data = SchemaMapper.toEntity<UserProfile>(DbTable.USER_PROFILES, user_profile_data);
            education_data = education_data.map((row: any) => SchemaMapper.toEntity(DbTable.USER_EDUCATION, row));
            experience_data = experience_data.map((row: any) => SchemaMapper.toEntity(DbTable.USER_EXPERIENCES, row));

            return {
              ...userFields,
                profile: userSearchParams.isShowUserProfileData ? user_profile_data : undefined,
                education: userSearchParams.isShowUserProfileData && userSearchParams.isShowUserEducationData ? education_data : undefined,
                experience: userSearchParams.isShowUserProfileData && userSearchParams.isShowUserExperienceData ? experience_data : undefined,
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

    async updateByParams(userFields: Partial<UserSearchOptions>,
        userUpdateFields: Partial<UserType>,
        client?: PoolClient
    ): Promise<GeneralAppResponse<User[]>> {
            // Build the QueryFields object
            const searchQueryFields: QueryFields = this.createSearchFields(userFields);
            // Prepare the update fields
            const updateFields = SchemaMapper.toDbSchema(DbTable.USERS, userUpdateFields);
            // Build the query
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.USERS, updateFields, searchQueryFields);
            // Execute the query
            return await this.executeQuery<User>(query, params, client);
    }

    private createSearchFields(userFields: Partial<UserSearchOptions>, tableSearch?: string): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(userFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            if(value === null) {
                operation = QueryOperation.IS_NULL;
            }
            else if(key == 'id') {
                operation = QueryOperation.EQUALS;
            } else if (isEnumField(this.tableName, key)) {
                operation = QueryOperation.EQUALS;
            } else if (typeof value === 'string') {
                operation = QueryOperation.ILIKE;
            } else {
                operation = QueryOperation.EQUALS;
            }
            let keyToUse = SchemaMapper.toDbField(DbTable.USERS, key);
            if(tableSearch) {
                keyToUse = `${tableSearch}.${keyToUse}`;
            }
            // Add the field to the queryFields object
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }
}

export { UserRepository };