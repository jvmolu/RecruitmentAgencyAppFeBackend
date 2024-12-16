import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { Job, JobSearchOptions, JobSearchParams, JobType, JobWithCompanyData } from "../types/zod/job-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { JoinClause, JoinType } from '../types/enums/join-type';
import { Company, CompanyType } from '../types/zod/company-entity';

class JobRepository extends BaseRepository {

    constructor() {
        super(DbTable.JOBS);
    }

    // Create a new Job
    async create(job: JobType): Promise<GeneralAppResponse<Job>> {
        try {
            const jobDbFields = SchemaMapper.toDbSchema(DbTable.JOBS, job);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.JOBS, jobDbFields);
            const response: GeneralAppResponse<Job[]> = await this.executeQuery<Job>(query, params);
            // If the response is a failure response, directly return
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }
            // If the response is a success response, return the first element of the output array
            // SuccessResponse<Job[]> -> SuccessResponse<Job> is required hence converting the response
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

    async updateByParams(jobSearchFields: Partial<JobSearchOptions>, jobUpdateFields: Partial<JobType>): Promise<GeneralAppResponse<Job[]>> {
        // Build the QueryFields object
        const searchQueryFields: QueryFields = this.createSearchFields(jobSearchFields);
        // Prepare the update fields
        const updateFields = SchemaMapper.toDbSchema(DbTable.JOBS, jobUpdateFields);
        // Build the query
        const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.JOBS, updateFields, searchQueryFields);
        // Execute the query
        return await this.executeQuery<Job>(query, params);
    }

    async findByParams(
        jobFields: Partial<JobSearchOptions>,
        jobSearchParams: JobSearchParams
      ): Promise<GeneralAppResponse<JobWithCompanyData[]>> {

        try {

          const searchQueryFields: QueryFields = this.createSearchFields(jobFields);
          const companyTableAlias = 'c';
          const applicationsTableAlias = 'a';
          const matchesTableAlias = 'm';
          const jobTableAlias = 't0';
    
          // Define JOIN clause to join with companies table
          const joins: JoinClause[] = [
            {
              joinType: JoinType.LEFT,
              tableName: DbTable.COMPANIES,
              alias: companyTableAlias,
              onCondition: `${jobTableAlias}.company_id = ${companyTableAlias}.id`,
            },
          ];

          const selectFieldsAndAlias = [
            { field: `${jobTableAlias}.*` },
            { field: `${companyTableAlias}.name`, alias: 'company_name' }, // Not selected by jobTableAlias.*
            { field: `${companyTableAlias}.website`, alias: 'company_website' }, // Not selected by jobTableAlias.*
          ]

          let groupByFields: string[] = [`${jobTableAlias}.id`, `${companyTableAlias}.id`];

          if(jobSearchParams.isShowAppliesCount) {
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.APPLICATIONS,
              alias: applicationsTableAlias,
              onCondition: `${jobTableAlias}.id = ${applicationsTableAlias}.job_id`,
            });
            selectFieldsAndAlias.push({
              field: `COUNT(DISTINCT ${applicationsTableAlias}.id)`,
              alias: 'applies_count',
            });
          }

          if(jobSearchParams.isShowMatchesCount) {
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.MATCHES,
              alias: matchesTableAlias,
              onCondition: `${jobTableAlias}.id = ${matchesTableAlias}.job_id`,
            });
            selectFieldsAndAlias.push({
              field: `COUNT(DISTINCT ${matchesTableAlias}.id)`,
              alias: 'matches_count',
            });
          }

          let offset = 0;
          if (jobSearchParams.page && jobSearchParams.limit) {
            offset = (jobSearchParams.page - 1) * jobSearchParams.limit;
          }

          const { query, params } = QueryBuilder.buildSelectQuery(
            DbTable.JOBS,
            searchQueryFields,
            jobTableAlias,
            selectFieldsAndAlias,
            joins,
            groupByFields,
            jobSearchParams.limit,
            offset,
            jobSearchParams.orderBy,
            jobSearchParams.order
          );

          const response: GeneralAppResponse<any[]> = await this.executeQuery<any>(query, params);

          if (isGeneralAppFailureResponse(response)) {
            return response;
          }

          // Map the result to include company data
          const data: JobWithCompanyData[] = response.data.map((row) => {
            const { applies_count, matches_count, company_name, company_website, ...jobFields } = row;
            return {
              ...jobFields,
              company: jobSearchParams.isShowCompanyData ? {
                id: jobFields.companyId,
                name: company_name,
                website: company_website,
              } : undefined,
              appliesCount: jobSearchParams.isShowAppliesCount ? applies_count : undefined,
              matchesCount: jobSearchParams.isShowMatchesCount ? matches_count : undefined,
            };
          });

          return { success: true, data };
        } 
        catch (error: any) 
        {
            return {
              error: error,
              businessMessage: 'Internal server error',
              statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
              success: false,
            };
        }
    }



    private createSearchFields(jobFields: Partial<JobSearchOptions>): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(jobFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            if(value === null) 
            {
                operation = QueryOperation.IS_NULL;
            }
            else if(key === 'id' || key === 'companyId' || key === 'partnerId')
            {
                operation = QueryOperation.EQUALS;
            }
            else if (isEnumField(this.tableName, key)) 
            {
                operation = QueryOperation.EQUALS;
            }
            else if(Array.isArray(value))
            {
                operation = QueryOperation.ARRAY_INTERSECTS;
            }
            else if (typeof value === 'string')
            {
                operation = QueryOperation.ILIKE;
            } 
            else 
            {
                operation = QueryOperation.EQUALS;
            }
            const keyToUse = SchemaMapper.toDbField(DbTable.JOBS, key);
            // Add the field to the queryFields object
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }

}

export { JobRepository };
