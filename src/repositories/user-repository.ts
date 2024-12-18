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

class UserRepository extends BaseRepository {

    constructor() {
        super(DbTable.USERS);
    }

    async create(user: UserType): Promise<GeneralAppResponse<User>> {
        try {
            const userDbFields = SchemaMapper.toDbSchema(DbTable.USERS, user);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.USERS, userDbFields);
            const response: GeneralAppResponse<User[]> = await this.executeQuery<User>(query, params);
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
        userSearchParams: UserSearchParams = {limit: 1, page: 1, isShowUserProfileData: false, orderBy: 'created_at', order:SortOrder.DESC}
      ): Promise<GeneralAppResponse<UserWithProfileData[]>> {
        try {
          const searchQueryFields: QueryFields = this.createSearchFields(userFields);
          const userTableAlias = 'u';
          const profileTableAlias = 'p';
      
          const joins: JoinClause[] = [];
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
            selectFieldsAndAlias.push({ field: `${profileTableAlias}.id`, alias: 'user_profile_id' });
            selectFieldsAndAlias.push({ field: `${profileTableAlias}.skills`, alias: 'user_skills' });
          }

          let groupByFields: string[] = [];
      
          let offset = 0;
          if (userSearchParams.page && userSearchParams.limit) {
            offset = (userSearchParams.page - 1) * userSearchParams.limit;
          }

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
            const { user_profile_id, user_skills, ...userFields } = row;
            return {
              ...userFields,
              profile: userSearchParams.isShowUserProfileData ? {
                id: user_profile_id,
                skills: user_skills,
              } : undefined
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

    private createSearchFields(userFields: Partial<UserSearchOptions>): QueryFields {
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
            const keyToUse = SchemaMapper.toDbField(DbTable.USERS, key);
            // Add the field to the queryFields object
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }
}

export { UserRepository };