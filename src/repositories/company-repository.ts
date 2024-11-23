import HttpStatusCode from "../enums/http-status-codes";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { Company, CompanyType } from "../types/zod/company-entity";
import { BaseRepository } from "./base-repository";

class CompanyRepository extends BaseRepository {

    async create(company: CompanyType): Promise<GeneralAppResponse<Company>> {
        try {
            const query: string = `INSERT INTO ${this.tableName} (id, name, website, address, is_partner, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
            const params: any[] = [company.id, company.name, company.website, company.address, company.isPartner, company.status, company.createdAt, company.updatedAt];
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
    async findByParams(userFields: Partial<CompanyType>): Promise<GeneralAppResponse<Company[]>> {
        try {
            const {query, params} = this.createGeneralSelectQuery(userFields);
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