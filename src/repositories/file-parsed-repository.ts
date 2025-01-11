import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { FileParsedSearchOptions, FileParsedType } from "../types/zod/file-parsed";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";

class FileParsedRepository extends BaseRepository {

  constructor() {
    super(DbTable.FILE_PARSED);
  }

  async create(fileParsing: FileParsedType): Promise<GeneralAppResponse<FileParsedType>> {
    try {
      const dbFields = SchemaMapper.toDbSchema(DbTable.FILE_PARSED, fileParsing);
      const { query, params } = QueryBuilder.buildInsertQuery(DbTable.MATCH_REPORTS, dbFields);
      const response = await this.executeQuery<FileParsedType>(query, params);
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

  async findByParams(fields: Partial<FileParsedSearchOptions>): Promise<GeneralAppResponse<FileParsedType[]>> {
    try {
      const queryFields: QueryFields = {};

      Object.entries(fields).forEach(([key, value]) => {
        const operation = value === null ? QueryOperation.IS_NULL : QueryOperation.EQUALS;
        const dbField = SchemaMapper.toDbField(DbTable.FILE_PARSED, key);
        queryFields[dbField] = { value, operation };
      });

      const { query, params } = QueryBuilder.buildSelectQuery(this.tableName, queryFields);
      return await this.executeQuery<FileParsedType>(query, params);

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

export { FileParsedRepository };