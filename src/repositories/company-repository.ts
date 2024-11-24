import DbTable from "../enums/db-table";
import HttpStatusCode from "../enums/http-status-codes";
import QueryOperation from "../enums/query-operation";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { Company, CompanyType } from "../types/zod/company-entity";
import { BaseRepository } from "./base-repository";
import { QueryBuilder, QueryFields } from "./query-builder/query-builder";
import { SchemaMapper } from "./table-entity-mapper/schema-mapper";

class CompanyRepository extends BaseRepository {

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
    async findByParams(companyFields: Partial<CompanyType>): Promise<GeneralAppResponse<Company[]>> {
        try {
            // Build the QueryFields object
            const queryFields: QueryFields = {};
            Object.entries(companyFields).forEach(([key, value]) => {
                let operation: QueryOperation;
                if(value === null) {
                    operation = QueryOperation.IS_NULL;
                } else if (typeof value === 'string' && key != 'id') {
                    operation = QueryOperation.ILIKE;
                }
                else {
                    operation = QueryOperation.EQUALS;
                }
                const keyToUse = SchemaMapper.toDbField(DbTable.COMPANIES, key);
                // Add the field to the queryFields object
                queryFields[keyToUse] = { value, operation };
            });
            const { query, params } = QueryBuilder.buildSelectQuery(DbTable.COMPANIES, queryFields);
            return await this.executeQuery<Company>(query, params);
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

export { CompanyRepository };