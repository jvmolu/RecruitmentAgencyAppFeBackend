import { UserRepository } from "../repositories/user-repository";
import { User, UserType, UserSchema } from "../types/zod/user-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse, isGeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { hashPassword, comparePassword } from "../common/hash-util"; 
import { generateJWTToken, getUserIdFromToken } from "../common/jwt-util";
import { UserAuthData } from "../types/response/user-auth-data-response";
import DbTable from "../enums/db-table";
import { AuthError } from "../types/error/auth-error";

export class UserService {

    private static userRepository: UserRepository = new UserRepository(DbTable.USERS);

    public async createUser(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<Omit<UserAuthData, "password">>> {
        
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

        let response: GeneralAppResponse<User> = await UserService.userRepository.create(user);

        if (isGeneralAppResponse(response)) {
            // Remove password from the response
            let {password, ...userDataResponse} = response.data;
            return {
                data: {
                    ...userDataResponse,
                    token: generateJWTToken(response.data.id)
                },
                success: true
            };
        }

        return response;
    }

    public async loginUser(userData: Pick<UserType, 'email' | 'password'>): Promise<GeneralAppResponse<Omit<UserAuthData, "password">>> {

        const validationResult = UserSchema.pick({email: true, password: true}).safeParse(userData);

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

        let response: GeneralAppResponse<User> = await UserService.userRepository.findByEmail(userData.email);

        if (isGeneralAppResponse(response)) {
            const user: User = response.data;
            if(!user) {
                let authError: AuthError = new Error('Invalid email') as AuthError;
                authError.errorType = 'AuthError';
                return {
                    error: authError,
                    statusCode: 401,
                    businessMessage: 'Invalid email',
                    success: false
                };
            }

            const isPasswordMatched = await comparePassword(userData.password, user.password);
            if (isPasswordMatched) {
                let {password, ...userDataResponse} = user;
                return {
                    data: {
                        ...userDataResponse,
                        token: generateJWTToken(user.id)
                    },
                    success: true
                };
            }

            console.log("Invalid password");
            const authError: AuthError = new Error('Invalid password') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: 401,
                businessMessage: 'Invalid password',
                success: false
            };
        }

        return response;
    }
    // Todo User -> User[]
    public async findAllUsers(): Promise<GeneralAppResponse<User[]>> {
        return await UserService.userRepository.findAll();
    }

    public async findUserByToken(token: string | undefined): Promise<GeneralAppResponse<Omit<UserAuthData, "password">>> {
        if(!token) {
            const authError: AuthError = new Error('Token not provided') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: 401,
                businessMessage: 'Token not provided',
                success: false
            };
        }
        const userId = await getUserIdFromToken(token);

        if (!userId) {
            const authError: AuthError = new Error('Invalid token') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: 401,
                businessMessage: 'Invalid token',
                success: false
            };
        }

        let response: GeneralAppResponse<User> = await UserService.userRepository.findById(userId); 

        if (isGeneralAppResponse(response)) {
            let {password, ...userDataResponse} = response.data;
            return {
                data: {
                    ...userDataResponse,
                    token: token
                },
                success: true
            };

        }

        return response;
    }
}