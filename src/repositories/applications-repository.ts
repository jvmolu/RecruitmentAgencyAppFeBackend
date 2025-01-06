import { PoolClient } from "pg";
import { isEnumField } from "../types/enum-field-mapping";
import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import QueryOperation from "../types/enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { Application, ApplicationSearchOptions, ApplicationSearchParams, ApplicationType, ApplicationWithRelatedData } from "../types/zod/application-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import { JoinClause, JoinType } from "../types/enums/join-type";
import { User } from "../types/zod/user-entity";
import { UserProfile } from "../types/zod/user-profile-entity";
import { ApplicationLifecycleType } from "../types/zod/application-lifecycle-entity";
import { v4 as uuidv4 } from "uuid";
import { JobSearchOptions } from "../types/zod/job-entity";

class ApplicationRepository extends BaseRepository {
    constructor() {
        super(DbTable.APPLICATIONS);
    }

    // Insert lifecycle entry
    public async insertLifecycles(
      lifecycleData: ApplicationLifecycleType[],
      client?: PoolClient
    ): Promise<GeneralAppResponse<ApplicationLifecycleType[]>> {
      const fields = lifecycleData.map((data) => SchemaMapper.toDbSchema(DbTable.APPLICATIONS_LIFECYCLE, data));
      const { query, params } = QueryBuilder.buildBulkInsertQuery(DbTable.APPLICATIONS_LIFECYCLE, fields);
      const response = await this.executeQuery<ApplicationLifecycleType>(query, params, client);
      if (isGeneralAppFailureResponse(response)) {
        return response;
      }
      return { success: true, data: response.data };
    }

    private fetchJobFieldsFromApplicationFields(applicationFields: Partial<ApplicationSearchOptions>): Partial<JobSearchOptions> {
      const jobCols: string[] = ['workModel', 'jobType', 'location', 'title'];
      const jobFields: { [key: string]: any } = {};
      jobCols.forEach((col: string) => {
          if(applicationFields[col as keyof ApplicationSearchOptions]) {
              jobFields[col] = applicationFields[col as keyof ApplicationSearchOptions];
              delete applicationFields[col as keyof ApplicationSearchOptions];
          }
      });
      return jobFields as Partial<JobSearchOptions>;
  }

    /**
     * Create a new application
    **/
    async create(application: ApplicationType, client?: PoolClient): Promise<GeneralAppResponse<Application>> {
        try {
            const applicationDbFields = SchemaMapper.toDbSchema(DbTable.APPLICATIONS, application);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.APPLICATIONS, applicationDbFields);
            const response: GeneralAppResponse<Application[]> = await this.executeQuery<Application>(query, params, client);
            
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }

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

    /**
     * Find applications by parameters
    **/
    async findByParams(
        applicationFields: Partial<ApplicationSearchOptions>,
        applicationSearchParams: ApplicationSearchParams
      ): Promise<GeneralAppResponse<ApplicationWithRelatedData[]>> {
        
        try {

          const applicationTableAlias = 'a';
          const jobTableAlias = 'j';
          const companyTableAlias = 'c';
          const candidateTableAlias = 'u';
          const userProfileTableAlias = 'up';
          const experienceTable = 'ex';
          const lifecycleTableAlias = 'l';

          // Fetch job fields from application fields
          const jobFields = this.fetchJobFieldsFromApplicationFields(applicationFields);

          const applicationSearchQueryFields: QueryFields = this.createSearchFields(applicationFields, applicationTableAlias);
          const jobSearchQueryFields: QueryFields = this.createSearchFields(jobFields, jobTableAlias);
          const searchQueryFields: QueryFields = { ...applicationSearchQueryFields, ...jobSearchQueryFields };

          const joins: JoinClause[] = [];
          const selectFieldsAndAlias: {field: string, alias?: string}[] = [
            { field: `${applicationTableAlias}.*` },
          ];

          let groupByFields = [`${applicationTableAlias}.id`];
      
          if (applicationSearchParams.isShowJobData || Object.keys(jobFields).length > 0) {
            
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.JOBS,
              alias: jobTableAlias,
              onCondition: `${applicationTableAlias}.job_id = ${jobTableAlias}.id`,
            });

            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.COMPANIES,
              alias: companyTableAlias,
              onCondition: `${jobTableAlias}.company_id = ${companyTableAlias}.id`,
            });

            selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${jobTableAlias}.*)`, alias: 'job_data' });
            selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${companyTableAlias}.*)`, alias: 'company_data' });
          }
      
          if (applicationSearchParams.isShowCandidateData) {
            
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.USERS,
              alias: candidateTableAlias,
              onCondition: `${applicationTableAlias}.candidate_id = ${candidateTableAlias}.id`,
            });

            // Join users with user_profiles
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.USER_PROFILES,
              alias: userProfileTableAlias,
              onCondition: `${candidateTableAlias}.id = ${userProfileTableAlias}.user_id`,
            });

            // Experience data
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.USER_EXPERIENCES,
              alias: experienceTable,
              onCondition: `${userProfileTableAlias}.id = ${experienceTable}.user_profile_id`,
            });

            selectFieldsAndAlias.push(
              { field: `json_agg(DISTINCT ${candidateTableAlias}.*)`, alias: 'candidate_data' },
              { field: `json_agg(DISTINCT ${userProfileTableAlias}.*)`, alias: 'user_profile_data' },
              { field: `json_agg(DISTINCT ${experienceTable}.*)`, alias: 'experience_data' }
            );
          }

          if(applicationSearchParams.isShowLifeCycleData) {
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.APPLICATIONS_LIFECYCLE,
              alias: lifecycleTableAlias,
              onCondition: `${applicationTableAlias}.id = ${lifecycleTableAlias}.application_id`,
            });

            selectFieldsAndAlias.push(
              { field: `json_agg(DISTINCT ${lifecycleTableAlias}.*)`, alias: 'lifecycle_data' }
            );
          }
          
          let offset = 0;
          if (applicationSearchParams.page && applicationSearchParams.limit) {
            offset = (applicationSearchParams.page - 1) * applicationSearchParams.limit;
          }

          // Order by
          applicationSearchParams.orderBy = SchemaMapper.toDbField(DbTable.APPLICATIONS, applicationSearchParams.orderBy);
      
          const { query, params } = QueryBuilder.buildSelectQuery(
            DbTable.APPLICATIONS,
            searchQueryFields,
            applicationTableAlias,
            selectFieldsAndAlias,
            joins,
            groupByFields,
            applicationSearchParams.limit,
            offset,
            applicationSearchParams.orderBy,
            applicationSearchParams.order
          );

          const response: GeneralAppResponse<any[]> = await this.executeQuery<any>(query, params);
          if (isGeneralAppFailureResponse(response)) {
            return response;
          }
      
          // Map the result to include related data
          const data: ApplicationWithRelatedData[] = response.data.map((row) => {
            let { job_data, company_data, candidate_data, lifecycle_data, user_profile_data, experience_data, ...applicationFields } = row;

            experience_data = experience_data && experience_data.length > 0 && experience_data[0] !== null ? experience_data : [];
            lifecycle_data = lifecycle_data && lifecycle_data.length > 0 && lifecycle_data[0] !== null ? lifecycle_data : [];
            user_profile_data = user_profile_data && user_profile_data.length > 0 && user_profile_data[0] !== null ? user_profile_data[0] : [];
            candidate_data = candidate_data && candidate_data.length > 0 && candidate_data[0] !== null ? candidate_data[0] : [];
            job_data = job_data && job_data.length > 0 && job_data[0] !== null ? job_data[0] : [];
            company_data = company_data && company_data.length > 0 && company_data[0] !== null ? company_data[0] : [];

            // Use Schema Mapper to convert the fields to the entity
            candidate_data = SchemaMapper.toEntity<User>(DbTable.USERS, candidate_data);
            job_data = SchemaMapper.toEntity(DbTable.JOBS, job_data);
            company_data = SchemaMapper.toEntity(DbTable.COMPANIES, company_data);
            user_profile_data = SchemaMapper.toEntity<UserProfile>(DbTable.USER_PROFILES, user_profile_data);
            experience_data = experience_data.map((row: any) => SchemaMapper.toEntity(DbTable.USER_EXPERIENCES, row));
            lifecycle_data = lifecycle_data.map((row: any) => SchemaMapper.toEntity(DbTable.APPLICATIONS_LIFECYCLE, row));

            // Sort Lifecycle data by createdAt in DESC order
            lifecycle_data = lifecycle_data.sort((a: ApplicationLifecycleType, b: ApplicationLifecycleType) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            return {
                ...applicationFields,
                job: applicationSearchParams.isShowJobData ? { ...job_data, company: company_data } : undefined,
                candidate: applicationSearchParams.isShowCandidateData ? {
                  ...candidate_data,
                  profile: user_profile_data,
                  experience: experience_data
                } : undefined,
                lifecycle: applicationSearchParams.isShowLifeCycleData ? lifecycle_data : undefined
            };
          });
      
          return { success: true, data };
        } 
        catch (error: any) 
        {
          return {
            error,
            businessMessage: 'Internal server error',
            statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            success: false,
          };
        }
      }

    /**
     * Update applications by parameters
     */
    async updateByParams(
        applicationSearchFields: Partial<ApplicationSearchOptions>,
        applicationUpdateFields: Partial<ApplicationType>,
        client?: PoolClient
    ): Promise<GeneralAppResponse<Application[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(applicationSearchFields);
            const updateFields = SchemaMapper.toDbSchema(DbTable.APPLICATIONS, applicationUpdateFields);
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.APPLICATIONS, updateFields, searchQueryFields);
            const response: GeneralAppResponse<Application[]> = await this.executeQuery<Application>(query, params, client);

            if (isGeneralAppFailureResponse(response)) {
              return response;
            }
            return response;                        
        } catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    /**
     * Create search fields for query building
    **/
    private createSearchFields(applicationFields: Partial<ApplicationSearchOptions>, tableAlias?: string): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(applicationFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            if(value === null) {
                operation = QueryOperation.IS_NULL;
            } else if(key === 'id' || key === 'candidateId' || key === 'jobId' || key === 'inviteId') {
                operation = QueryOperation.EQUALS;
            } else if (isEnumField(this.tableName, key)) {
                operation = QueryOperation.EQUALS;
            } else if (typeof value === 'string') {
                operation = QueryOperation.ILIKE;
            } else {
                operation = QueryOperation.EQUALS;
            }
            let keyToUse = SchemaMapper.toDbField(DbTable.APPLICATIONS, key);
            if(tableAlias) {
                keyToUse = `${tableAlias}.${keyToUse}`;
            }
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }
}

export { ApplicationRepository };