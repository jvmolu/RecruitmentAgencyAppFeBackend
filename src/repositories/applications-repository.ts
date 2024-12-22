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

class ApplicationRepository extends BaseRepository {
    constructor() {
        super(DbTable.APPLICATIONS);
    }

    /**
     * Create a new application
     */
    async create(application: ApplicationType): Promise<GeneralAppResponse<Application>> {
        try {
            const applicationDbFields = SchemaMapper.toDbSchema(DbTable.APPLICATIONS, application);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.APPLICATIONS, applicationDbFields);
            const response: GeneralAppResponse<Application[]> = await this.executeQuery<Application>(query, params);
            
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
          const candidateTableAlias = 'u';
          const userProfileTableAlias = 'up';
          const experienceTable = 'ex';
          const searchQueryFields: QueryFields = this.createSearchFields(applicationFields, applicationTableAlias);
      
          const joins: JoinClause[] = [];
          const selectFieldsAndAlias: {field: string, alias?: string}[] = [
            { field: `${applicationTableAlias}.*` },
          ];

          let groupByFields = [`${applicationTableAlias}.id`];
      
          if (applicationSearchParams.isShowJobData) {
            joins.push({
              joinType: JoinType.LEFT,
              tableName: DbTable.JOBS,
              alias: jobTableAlias,
              onCondition: `${applicationTableAlias}.job_id = ${jobTableAlias}.id`,
            });
            selectFieldsAndAlias.push({ field: `${jobTableAlias}.title`, alias: 'job_title' });
            groupByFields.push(`${jobTableAlias}.title`);
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
          
          let offset = 0;
          if (applicationSearchParams.page && applicationSearchParams.limit) {
            offset = (applicationSearchParams.page - 1) * applicationSearchParams.limit;
          }
      
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
            let { job_title, candidate_data, user_profile_data, experience_data, ...applicationFields } = row;

            experience_data = experience_data.length > 0 && experience_data[0] !== null ? experience_data : [];
            user_profile_data = user_profile_data.length > 0 && user_profile_data[0] !== null ? user_profile_data[0] : [];
            candidate_data = candidate_data.length > 0 && candidate_data[0] !== null ? candidate_data[0] : [];

            return {
                ...applicationFields,
                job: applicationSearchParams.isShowJobData ? { title: job_title } : undefined,
                candidate: applicationSearchParams.isShowCandidateData ? {
                  ...candidate_data,
                  profile: user_profile_data,
                  experience: experience_data
                } : undefined,
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
            return await this.executeQuery<Application>(query, params, client);
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