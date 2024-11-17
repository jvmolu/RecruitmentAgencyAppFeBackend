import { UserRepository } from "../repositories/user-repository";
import { User, UserType, UserSchema } from "../types/entities/user-entity";
import { IDatabaseError } from "../types/error/i-database-error";
import { v4 as uuidv4 } from 'uuid';

export class UserService {

    private static userRepository: UserRepository = new UserRepository();

    public async createUser(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>): Promise<{output: User, success: true} | {error: IDatabaseError, success: false}> {        
        const user: UserType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...userData
        };

        // Validate user data
        UserSchema.parse(user);

        return await UserService.userRepository.create(user);
    }

    public async findAllUsers(): Promise<{output: User, success: true} | {error: IDatabaseError, success: false}> {
        return await UserService.userRepository.findAll();
    }
}