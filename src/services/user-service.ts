import { UserRepository } from "../repositories/user-repository";
import { User, UserType, UserSchema } from "../types/zod/user-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse, isGeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { hashPassword } from "../common/hash-util"; 
import { generateJWTToken } from "../common/jwt-util";
import { UserAuthData } from "../types/response/user-auth-data-response";
export class UserService {

    private static userRepository: UserRepository = new UserRepository();

    public async createUser(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<UserAuthData>> {        
        
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
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: 400,
                businessMessage: 'Invalid user data',
                success: false
            };
        }

        const hashedPassword = await hashPassword(user.password);
        user.password = hashedPassword;
        const token: string = await generateJWTToken(user.id);
        const response: GeneralAppResponse<User> = await UserService.userRepository.create(user);

        if (isGeneralAppResponse(response)) {
            return {
                data: {
                    user: response.data,
                    token: token
                },
                success: true
            };
        }

        return response;
    }

    // Todo User -> User[]
    public async findAllUsers(): Promise<GeneralAppResponse<User>> {
        return await UserService.userRepository.findAll();
    }
}