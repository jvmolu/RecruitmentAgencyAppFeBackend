import { BaseRepository } from "./base-repository";
import { User, UserType } from "../types/zod/user-entity";
import DbTable from "../enums/db-table";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";

class UserRepository extends BaseRepository {

    async create(user: UserType): Promise<GeneralAppResponse<User>> {
        try {
            const query: string = `INSERT INTO ${this.tableName} (id, first_name, last_name, phone, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
            const params: any[] = [user.id, user.firstName, user.lastName, user.phone, user.email, user.password, user.createdAt, user.updatedAt];
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
                statusCode: 500,
                success: false
            }
        }
    }

    async findAll(): Promise<GeneralAppResponse<User[]>> {
        try {
            const query = `SELECT * FROM ${DbTable.USERS}`;
            return await this.executeQuery<User>(query);
        }
        catch (error: any) {
            return {
                error: error,
                businessMessage: 'Internal server error',
                statusCode: 500,
                success: false
            }
        }
    }
}

export { UserRepository };