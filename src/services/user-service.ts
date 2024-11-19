import { UserRepository } from "../repositories/user-repository";
import { User, UserType, UserSchema } from "../types/zod/user-entity";
import { DatabaseError } from "../types/error/database-error";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse } from "../types/response/general-app-response";
import { ZodError } from "zod";
import { ZodParsingError } from "../types/error/zod-parsing-error";

export class UserService {

    private static userRepository: UserRepository = new UserRepository();

    public async createUser(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<User>> {        
        
        const user: UserType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...userData
        };

        // Validate user data
        const validationResult = UserSchema.safeParse(user);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            return {
                error: zodError,
                statusCode: 400,
                businessMessage: 'Invalid user data',
                success: false
            };
        }

        return await UserService.userRepository.create(user);
    }

    // Todo User -> User[]
    public async findAllUsers(): Promise<GeneralAppResponse<User>> {
        return await UserService.userRepository.findAll();
    }
}