// src/repositories/match-report-repository.ts
import { BaseRepository } from "./base-repository";
import { MatchReportType, MatchReport, MatchReportSearchOptions } from "../types/zod/match-report-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import QueryOperation from "../types/enums/query-operation";
import HttpStatusCode from "../types/enums/http-status-codes";
import { PoolClient } from "pg";

class MatchReportRepository extends BaseRepository {

  constructor() {
    super(DbTable.MATCH_REPORTS);
  }

  async create(matchReport: MatchReportType, client?: PoolClient): Promise<GeneralAppResponse<MatchReport>> {
    try {
      const dbFields = SchemaMapper.toDbSchema(DbTable.MATCH_REPORTS, matchReport);
      const { query, params } = QueryBuilder.buildInsertQuery(DbTable.MATCH_REPORTS, dbFields);
      const response = await this.executeQuery<MatchReport>(query, params, client);
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

  async findByParams(fields: Partial<MatchReportSearchOptions>): Promise<GeneralAppResponse<MatchReport[]>> {
    try {
      const queryFields: QueryFields = {};

      Object.entries(fields).forEach(([key, value]) => {
        const operation = value === null ? QueryOperation.IS_NULL : QueryOperation.EQUALS;
        const dbField = SchemaMapper.toDbField(DbTable.MATCH_REPORTS, key);
        queryFields[dbField] = { value, operation };
      });

      const { query, params } = QueryBuilder.buildSelectQuery(this.tableName, queryFields);
      return await this.executeQuery<MatchReport>(query, params);

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

export { MatchReportRepository };