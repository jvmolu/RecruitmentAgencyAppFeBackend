// src/repositories/match-repository.ts
import { BaseRepository } from "./base-repository";
import { MatchType, Match, MatchSearchOptions, MatchSearchParams, MatchWithRelatedData } from "../types/zod/match-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import QueryOperation from "../types/enums/query-operation";
import HttpStatusCode from "../types/enums/http-status-codes";
import { JoinClause, JoinType } from "../types/enums/join-type";
import { User } from "../types/zod/user-entity";
import { UserProfile } from "../types/zod/user-profile-entity";
import { PoolClient } from "pg";

class MatchRepository extends BaseRepository {
    
  constructor() {
    super(DbTable.MATCHES);
  }

  async create(match: MatchType): Promise<GeneralAppResponse<Match>> {
    try {
      const dbFields = SchemaMapper.toDbSchema(DbTable.MATCHES, match);
      const { query, params } = QueryBuilder.buildInsertQuery(DbTable.MATCHES, dbFields);
      const response = await this.executeQuery<Match>(query, params);
      if (isGeneralAppFailureResponse(response)) {
        return response;
      }
      return { data: response.data[0], success: true };
    } catch (error: any) {
      return {
        error,
        businessMessage: 'Internal server error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async createMatchesInBulk(matches: MatchType[], client?: PoolClient): Promise<GeneralAppResponse<Match[]>> {
    try {
      const dbFields = matches.map((match) => SchemaMapper.toDbSchema(DbTable.MATCHES, match));
      if (dbFields.length === 0) {
        return {
          data: [],
          success: true,
        };
      }
      const { query, params } = QueryBuilder.buildBulkInsertQuery(DbTable.MATCHES, dbFields);
      const response = await this.executeQuery<Match>(query, params, client);
      if (isGeneralAppFailureResponse(response)) {
        return response;
      }
      return { data: response.data, success: true };
    } catch (error: any) {
      return {
        error,
        businessMessage: 'Internal server error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async findByParams(
    fields: Partial<MatchSearchOptions>,
    searchParams: MatchSearchParams
  ): Promise<GeneralAppResponse<MatchWithRelatedData[]>> {
    try {

      // New code: set aliases, define joins & select fields
      const tableAlias = 'm';
      const userAlias = 'u';
      const userProfileAlias = 'up';

      const queryFields: QueryFields = this.createSearchFields(fields, tableAlias);

      const joins: JoinClause[] = [];
      const selectFieldsAndAlias: { field: string; alias?: string }[] = [{ field: `${tableAlias}.*` }];

      const groupByFields: string[] = [`${tableAlias}.id`];

      // Example: join with users on candidate_id
      if (searchParams.isShowCandidateData) {
        
        joins.push({
          joinType: JoinType.LEFT,
          tableName: DbTable.USERS,
          alias: userAlias,
          onCondition: `${tableAlias}.candidate_id = ${userAlias}.id`,
        });

        joins.push({
          joinType: JoinType.LEFT,
          tableName: DbTable.USER_PROFILES,
          alias: userProfileAlias,
          onCondition: `${tableAlias}.candidate_id = ${userProfileAlias}.user_id`,
        });

        selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${userAlias}.*)`, alias: 'candidate_data' });
        selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${userProfileAlias}.*)`, alias: 'user_profile_data' });
      }

      let offset = 0;
      if (searchParams.page && searchParams.limit) {
        offset = (searchParams.page - 1) * searchParams.limit;
      }

      // Order by
      searchParams.orderBy = SchemaMapper.toDbField(DbTable.MATCHES, searchParams.orderBy);

      const { query, params } = QueryBuilder.buildSelectQuery(
        DbTable.MATCHES,
        queryFields,
        tableAlias,
        selectFieldsAndAlias,
        joins,
        groupByFields,
        searchParams.limit,
        offset,
        searchParams.orderBy,
        searchParams.order
      );

      const response: GeneralAppResponse<any[]> = await this.executeQuery<any>(query, params);
      if (isGeneralAppFailureResponse(response)) {
        return response;
      }

      const matchWithRelatedData: MatchWithRelatedData[] = response.data.map((row) => {
          let { candidate_data, user_profile_data, ...matchData } = row;

          user_profile_data = user_profile_data && user_profile_data.length > 0 && user_profile_data[0] !== null ? user_profile_data[0] : [];
          candidate_data = candidate_data && candidate_data.length > 0 && candidate_data[0] !== null ? candidate_data[0] : [];

          candidate_data = SchemaMapper.toEntity<User>(DbTable.USERS, candidate_data);
          user_profile_data = SchemaMapper.toEntity<UserProfile>(DbTable.USER_PROFILES, user_profile_data);

          return {
            ...matchData,
            candidate : searchParams.isShowCandidateData ? {
              ...candidate_data,
              profile: user_profile_data
            } : undefined
          };
      });

      return { data: matchWithRelatedData, success: true };

    } catch (error: any) {
      return {
        error,
        businessMessage: 'Internal server error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async deleteByParams(fields: Partial<MatchSearchOptions>, client?: PoolClient): Promise<GeneralAppResponse<MatchType[]>> {
    try {
      const searchQueryFields: QueryFields = this.createSearchFields(fields);
      const { query, params } = QueryBuilder.buildDeleteQuery(DbTable.MATCHES, searchQueryFields);
      return await this.executeQuery<Match>(query, params, client);
    } catch (error: any) {
        return {
            error,
            businessMessage: 'Internal server error',
            statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            success: false
        };
    }
  }

  private createSearchFields(fields: Partial<MatchSearchOptions>, tableAlias?: string): QueryFields {
    const searchFields: QueryFields = {};
    Object.entries(fields).forEach(([key, value]) => {
      const operation = value === null ? QueryOperation.IS_NULL : QueryOperation.EQUALS;
      let dbField = SchemaMapper.toDbField(DbTable.MATCHES, key);
      if (tableAlias) {
        dbField = `${tableAlias}.${dbField}`;
      }
      searchFields[dbField] = { value, operation };
    });
    return searchFields;
  }

}

export { MatchRepository };