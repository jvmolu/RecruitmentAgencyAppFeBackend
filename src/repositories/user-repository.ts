import { BaseRepository } from "./base-repository";
import { User, UserSearchOptions, UserType } from "../types/zod/user-entity";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import HttpStatusCode from "../types/enums/http-status-codes";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import DbTable from "../types/enums/db-table";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";
import QueryOperation from "../types/enums/query-operation";
import { isEnumField } from "../types/enum-field-mapping";

class UserRepository extends BaseRepository {

    constructor() {
        super(DbTable.USERS);
    }

    async create(user: UserType): Promise<GeneralAppResponse<User>> {
        try {
            const userDbFields = SchemaMapper.toDbSchema(DbTable.USERS, user);
            const { query, params } = QueryBuilder.buildInsertQuery(DbTable.USERS, userDbFields);
            const response: GeneralAppResponse<User[]> = await this.executeQuery<User>(query, params);
            // If the response is a failure response, directly return
            if(isGeneralAppFailureResponse(response)) {
                return response;
            }
            // If the response is a success response, return the first element of the output array
            // SuccessResponse<User[]> -> SuccessResponse<User> is required hence converting the response
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

    // Find By General Params
    async findByParams(userFields: Partial<UserSearchOptions>): Promise<GeneralAppResponse<User[]>> {
        try {
            // Build the QueryFields object
            const queryFields: QueryFields = {};
            Object.entries(userFields).forEach(([key, value]) => {
                let operation: QueryOperation;
                if(value === null) {
                    operation = QueryOperation.IS_NULL;
                } else if (isEnumField(this.tableName, key)) {
                    operation = QueryOperation.EQUALS;
                } else if (typeof value === 'string' && key !== 'id') {
                    operation = QueryOperation.ILIKE;
                } else {
                    operation = QueryOperation.EQUALS;
                }
                const keyToUse = SchemaMapper.toDbField(DbTable.USERS, key);
                // Add the field to the queryFields object
                queryFields[keyToUse] = { value, operation };
            });
            const { query, params } = QueryBuilder.buildSelectQuery(DbTable.USERS, queryFields);

            return await this.executeQuery<User>(query, params);
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
}

export { UserRepository };