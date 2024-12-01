// src/repositories/match-repository.ts
import { BaseRepository } from "./base-repository";
import { MatchType, Match, MatchSearchOptions } from "../types/zod/match-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import QueryOperation from "../types/enums/query-operation";
import HttpStatusCode from "../types/enums/http-status-codes";

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

  async findByParams(fields: Partial<MatchSearchOptions>): Promise<GeneralAppResponse<Match[]>> {
    try {
      const queryFields: QueryFields = {};
      Object.entries(fields).forEach(([key, value]) => {
        const operation = value === null ? QueryOperation.IS_NULL : QueryOperation.EQUALS;
        const dbField = SchemaMapper.toDbField(DbTable.MATCHES, key);
        queryFields[dbField] = { value, operation };
      });
      const { query, params } = QueryBuilder.buildSelectQuery(this.tableName, queryFields);
      return await this.executeQuery<Match>(query, params);
    } catch (error: any) {
      return {
        error,
        businessMessage: 'Internal server error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }
}

export { MatchRepository };