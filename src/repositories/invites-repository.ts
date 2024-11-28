// src/repositories/invite-repository.ts
import { BaseRepository } from "./base-repository";
import { Invite, InviteType, InviteSearchOptions } from "../types/zod/invite-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import QueryOperation from "../types/enums/query-operation";

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

    async findByParams(inviteFields: Partial<InviteSearchOptions>): Promise<GeneralAppResponse<Invite[]>> {
        try {
            const searchFields = this.createSearchFields(inviteFields);
            const { query, params } = QueryBuilder.buildSelectQuery(this.tableName, searchFields);
            return await this.executeQuery<Invite>(query, params);
        } catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                success: false
            }
        }
    }

    private createSearchFields(inviteFields: Partial<InviteSearchOptions>): QueryFields {
        const queryFields: QueryFields = {};
        Object.entries(inviteFields).forEach(([key, value]) => {
            let operation: QueryOperation;
            if(value === null) {
                operation = QueryOperation.IS_NULL;
            } else {
                operation = QueryOperation.EQUALS;
            }
            const keyToUse = SchemaMapper.toDbField(DbTable.INVITES, key);
            queryFields[keyToUse] = { value, operation };
        });
        return queryFields;
    }
}

export { InviteRepository };