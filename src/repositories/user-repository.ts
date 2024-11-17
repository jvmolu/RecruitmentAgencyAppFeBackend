import { BaseRepository } from "./base-repository";
import { User, UserType } from "../types/entities/user-entity";
import { IDatabaseError } from "../types/error/i-database-error";
import { DatabaseErrorHandler } from "../types/error/database-error-handler";
import DbTable from "../enums/db-table";

class UserRepository extends BaseRepository {

    async create(user: UserType): Promise<{output: User, success: true} | {error: IDatabaseError, success: false}> {
        try {
            
            const query = `INSERT INTO ${DbTable.USERS} (id, first_name, last_name, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
            const params = [user.id, user.firstName, user.lastName, user.email, user.password, user.createdAt, user.updatedAt];
            const response = await this.executeQuery<User[]>(query, params);
            if(!response.success) {
                return response;
            }
            return { output: response.output[0], success: true };
        }
        catch (error: any) {
            return { error: DatabaseErrorHandler.handle(error), success: false };
        }
    }

    async findAll(): Promise<{output: User, success: true} | {error: IDatabaseError, success: false}> {
        try {
            const query = `SELECT * FROM ${DbTable.USERS}`;
            return await this.executeQuery<User[]>(query);
        }
        catch (error: any) {
            return { error: DatabaseErrorHandler.handle(error), success: false };
        }
    }
}

export { UserRepository };