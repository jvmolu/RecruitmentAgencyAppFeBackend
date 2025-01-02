import { PoolClient } from "pg";
import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import { JoinClause, JoinType } from "../types/enums/join-type";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { ComapnySearchParams, Company, CompanySearchOptions, CompanyType, CompanyWithJobCount } from "../types/zod/company-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { isDateRange, isNumberRange } from "../types/zod/range-entities";

class CompanyRepository extends BaseRepository {

    constructor() {
        super(DbTable.COMPANIES);
    }

    async create(company: CompanyType): Promise<GeneralAppResponse<Company>> {
        try {
            const companyDbFields = SchemaMapper.toDbSchema(DbTable.COMPANIES, company);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.COMPANIES, companyDbFields);
            const response: GeneralAppResponse<Company[]> = await this.executeQuery<Company>(query, params);
            // If the response is a failure response, directly return
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }
            // If the response is a success response, return the first element of the output array
            // SuccessResponse<User[]> -> SuccessResponse<User> is required hence converting the response
            return { data: response.data[0], success: true };

        } catch (error: any) {
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
        companyFields: Partial<CompanySearchOptions>,
        companySearchParams: ComapnySearchParams
      ): Promise<GeneralAppResponse<CompanyWithJobCount[]>> {
        try {

          const companyTableAlias = 'c';
          const jobTableAlias = 'j';
          const searchQueryFields: QueryFields = this.createSearchFields(companyFields, companyTableAlias);
          
          const joins: JoinClause[] = [];
          const selectFieldsAndAlias: { field: string; alias?: string }[] = [
            { field: `${companyTableAlias}.*` },
          ];
      
          if (companySearchParams.isShowNumberOfJobs) {
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.JOBS,
              alias: jobTableAlias,
              onCondition: `${companyTableAlias}.id = ${jobTableAlias}.company_id`,
            });
            selectFieldsAndAlias.push({ field: `COUNT(DISTINCT ${jobTableAlias}.id)`, alias: 'jobs_count' });
          }
          
          let groupByFields = [];
          if (companySearchParams.isShowNumberOfJobs) {
            groupByFields.push(`${companyTableAlias}.id`);
          }

          let offset = 0;
          if (companySearchParams.page && companySearchParams.limit) {
            offset = (companySearchParams.page - 1) * companySearchParams.limit;
          }

          // Order by
          companySearchParams.orderBy = SchemaMapper.toDbField(DbTable.COMPANIES, companySearchParams.orderBy);
      
          const { query, params } = QueryBuilder.buildSelectQuery(
            DbTable.COMPANIES,
            searchQueryFields,
            companyTableAlias,
            selectFieldsAndAlias,
            joins,
            groupByFields,
            companySearchParams.limit,
            offset,
            companySearchParams.orderBy,
            companySearchParams.order
          );
      
          const response: GeneralAppResponse<any[]> = await this.executeQuery<any>(query, params);
      
          if (isGeneralAppFailureResponse(response)) {
            return response;
          }
      
          const data: CompanyWithJobCount[] = response.data.map((row) => {
            const { jobs_count, ...companyFields } = row;
            return {
              ...companyFields,
              jobsCount: companySearchParams.isShowNumberOfJobs ? Number(jobs_count) : undefined,
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

    // Update by parameters
    async updateByParams(
      companySearchFields: Partial<CompanySearchOptions>,
      companyUpdateFields: Partial<CompanyType>,
      client?: PoolClient
  ): Promise<GeneralAppResponse<Company[]>> {
      try {
          const searchQueryFields: QueryFields = this.createSearchFields(companySearchFields);
          const updateFields = SchemaMapper.toDbSchema(DbTable.COMPANIES, companyUpdateFields);
          const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.COMPANIES, updateFields, searchQueryFields);
          return await this.executeQuery<Company>(query, params, client);
      } catch (error: any) {
          return {
              error,
              businessMessage: 'Internal server error',
              statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
              success: false
          };
      }
    }

    private createSearchFields(companyFields: Partial<CompanySearchOptions>, tableAlias?: string): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(companyFields).forEach(([key, value]) => {

            if(key.includes('Range')) {
                key = key.replace('Range', '');
            }
            let keyToUse = SchemaMapper.toDbField(DbTable.COMPANIES, key);
            if(tableAlias) keyToUse = `${tableAlias}.${keyToUse}`;

            let operation: QueryOperation;
            let valueToUse: any = value;

            if(value === null) {
                operation = QueryOperation.IS_NULL;
            } else if(key == 'id') {
                operation = QueryOperation.EQUALS;
            } else if (isEnumField(this.tableName, key)) {
                operation = QueryOperation.EQUALS;
            } else if (isNumberRange(value) || isDateRange(value)) {
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
            else if (typeof value === 'string') {
                operation = QueryOperation.ILIKE;
            } else {
                operation = QueryOperation.EQUALS;
            }

            // Add the field to the queryFields object
            queryFields[keyToUse] = { value:valueToUse, operation };
        });
        return queryFields;
    }
}

export { CompanyRepository };