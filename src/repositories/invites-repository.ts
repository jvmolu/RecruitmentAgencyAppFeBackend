// src/repositories/invite-repository.ts
import { BaseRepository } from "./base-repository";
import { Invite, InviteType, InviteSearchOptions, InviteSearchParams, InviteWithRelatedData } from "../types/zod/invite-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import QueryOperation from "../types/enums/query-operation";
import { PoolClient } from "pg";
import { JoinClause, JoinType } from "../types/enums/join-type";
import { User } from "../types/zod/user-entity";
import { UserProfile } from "../types/zod/user-profile-entity";
import { Job } from "../types/zod/job-entity";
import { Company } from "../types/zod/company-entity";
import { join } from "path";
import { JobService } from "../services/job-service";

class InviteRepository extends BaseRepository {

    constructor() {
        super(DbTable.INVITES);
    }

    async create(invite: InviteType): Promise<GeneralAppResponse<Invite>> {
        try {
            const inviteDbFields = SchemaMapper.toDbSchema(DbTable.INVITES, invite);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.INVITES, inviteDbFields);
            const response = await this.executeQuery<Invite>(query, params);
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

    async findByParams(
        inviteFields: Partial<InviteSearchOptions>,
        searchParams: InviteSearchParams,
        client?: PoolClient
    ): Promise<GeneralAppResponse<InviteWithRelatedData[]>> {
        try {
            
            const tableAlias = 'i';
            const userTableAlias = 'u';
            const jobTableAlias = 'j';
            const userProfileTableAlias = 'up';
            const companyTableAlias = 'c';
            const partnerTableAlias = 'p';

            const jobFields = JobService.fetchAndRemoveJobFields(inviteFields);

            const jobSearchFields = this.createSearchFields(jobFields, jobTableAlias, DbTable.JOBS);
            const inviteSearchFields = this.createSearchFields(inviteFields, tableAlias);
            const searchFields = { ...inviteSearchFields, ...jobSearchFields };

            const joins: JoinClause[] = [];
            const selectFieldsAndAlias: { field: string; alias?: string }[] = [{ field: `${tableAlias}.*` }];
      
            const groupByFields: string[] = [`${tableAlias}.id`];
      
            // Example: join with users on candidate_id
            if (searchParams.isShowCandidateData) {
              
              joins.push({
                joinType: JoinType.LEFT,
                tableName: DbTable.USERS,
                alias: userTableAlias,
                onCondition: `${tableAlias}.candidate_id = ${userTableAlias}.id`,
              });
      
              joins.push({
                joinType: JoinType.LEFT,
                tableName: DbTable.USER_PROFILES,
                alias: userProfileTableAlias,
                onCondition: `${tableAlias}.candidate_id = ${userProfileTableAlias}.user_id`,
              });
      
              selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${userTableAlias}.*)`, alias: 'candidate_data' });
              selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${userProfileTableAlias}.*)`, alias: 'user_profile_data' });
            }

            if(searchParams.isShowJobData || Object.keys(jobFields).length > 0) {
                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.JOBS,
                    alias: jobTableAlias,
                    onCondition: `${tableAlias}.job_id = ${jobTableAlias}.id`
                });

                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.COMPANIES,
                    alias: 'c',
                    onCondition: `${jobTableAlias}.company_id = ${companyTableAlias}.id`
                });

                joins.push({
                    joinType: JoinType.LEFT,
                    tableName: DbTable.COMPANIES,
                    alias: partnerTableAlias,
                    onCondition: `${jobTableAlias}.partner_id = ${partnerTableAlias}.id`
                });

                selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${jobTableAlias}.*)`, alias: 'job_data' });
                selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${companyTableAlias}.*)`, alias: 'company_data' });
                selectFieldsAndAlias.push({ field: `json_agg(DISTINCT ${partnerTableAlias}.*)`, alias: 'partner_data' });
            }
      
            let offset = 0;
            if (searchParams.page && searchParams.limit) {
              offset = (searchParams.page - 1) * searchParams.limit;
            }
      
            // Order by
            searchParams.orderBy = SchemaMapper.toDbField(DbTable.INVITES, searchParams.orderBy);
            
            const { query, params } = QueryBuilder.buildSelectQuery(
                DbTable.INVITES,
                searchFields,
                tableAlias,
                selectFieldsAndAlias,
                joins,
                groupByFields,
                searchParams.limit,
                offset,
                searchParams.orderBy,
                searchParams.order
            );

            const dbRes = await this.executeQuery<any>(query, params, client);
            if(isGeneralAppFailureResponse(dbRes)) {
                return dbRes;
            }

            const invitesWithRelatedData: InviteWithRelatedData[] = dbRes.data.map((row) => {
                let { candidate_data, user_profile_data, job_data, company_data, partner_data, ...inviteData } = row;

                user_profile_data = user_profile_data && user_profile_data.length > 0 && user_profile_data[0] !== null ? user_profile_data[0] : [];
                candidate_data = candidate_data && candidate_data.length > 0 && candidate_data[0] !== null ? candidate_data[0] : [];
                job_data = job_data && job_data.length > 0 && job_data[0] !== null ? job_data[0] : [];
                company_data = company_data && company_data.length > 0 && company_data[0] !== null ? company_data[0] : [];
                partner_data = partner_data && partner_data.length > 0 && partner_data[0] !== null ? partner_data[0] : [];
                
                candidate_data = SchemaMapper.toEntity<User>(DbTable.USERS, candidate_data);
                user_profile_data = SchemaMapper.toEntity<UserProfile>(DbTable.USER_PROFILES, user_profile_data);
                job_data = SchemaMapper.toEntity<Job>(DbTable.JOBS, job_data);
                company_data = SchemaMapper.toEntity<Company>(DbTable.COMPANIES, company_data);
                partner_data = SchemaMapper.toEntity<Company>(DbTable.COMPANIES, partner_data);

                return {
                    ...inviteData,
                    candidate: searchParams.isShowCandidateData ? {
                        ...candidate_data,
                        profile: user_profile_data
                    } : undefined,
                    job: searchParams.isShowJobData ? {
                        ...job_data,
                        company: company_data,
                        partner: partner_data
                    } : undefined
                };
            });

            return { data: invitesWithRelatedData, success: true };
        } catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    async updateByParams(inviteSearchFields: Partial<InviteSearchOptions>, inviteUpdateFields: Partial<InviteType>, client?: PoolClient): Promise<GeneralAppResponse<Invite[]>> {
        try {
            const searchQueryFields: QueryFields = this.createSearchFields(inviteSearchFields);
            const updateFields = SchemaMapper.toDbSchema(DbTable.INVITES, inviteUpdateFields);
            const { query, params } = QueryBuilder.buildUpdateQuery(DbTable.INVITES, updateFields, searchQueryFields);
            return await this.executeQuery<Invite>(query, params, client);
        } catch (error: any) {
            return {
                error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            };
        }
    }

    private createSearchFields(inviteFields: any, tableAlias?: string, table: DbTable = DbTable.INVITES): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(inviteFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            if(value === null) {
                operation = QueryOperation.IS_NULL;
            } else {
                operation = QueryOperation.EQUALS;
            }
            let keyToUse = SchemaMapper.toDbField(table, key);
            if(tableAlias) {
                keyToUse = `${tableAlias}.${keyToUse}`;
            }
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }
}

export { InviteRepository };