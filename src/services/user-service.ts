import { UserRepository } from "../repositories/user-repository";
import { User, UserType, UserSchema } from "../types/zod/user-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse, isGeneralAppFailureResponse, isGeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { hashPassword, comparePassword } from "../common/hash-util"; 
import { generateJWTToken, getUserIdFromToken } from "../common/jwt-util";
import { UserAuthData } from "../types/user-auth-data";
import DbTable from "../enums/db-table";
import { AuthError } from "../types/error/auth-error";
import HttpStatusCode from "../enums/http-status-codes";

export class UserService {

    private static userRepository: UserRepository = new UserRepository(DbTable.USERS);

    public static async createUser(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<Omit<UserAuthData, "password">>> {
        
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
                statusCode: HttpStatusCode.BAD_REQUEST,
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
            let generateTokenOutput: GeneralAppResponse<string> = generateJWTToken(userDataResponse.id);
            if(isGeneralAppFailureResponse(generateTokenOutput)) {
                return generateTokenOutput;
            }
            return {
                data: {
                    ...userDataResponse,
                    token: generateTokenOutput.data
                },
                success: true
            };
        }

        return response;
    }

    public static async loginUser(userData: Pick<UserType, 'email' | 'password'>): Promise<GeneralAppResponse<Omit<UserAuthData, "password">>> {

        const validationResult = UserSchema.pick({email: true, password: true}).safeParse(userData);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid user data',
                success: false
            };
        }

        let response: GeneralAppResponse<User> = await UserService.userRepository.findByEmail(userData.email);

        if(isGeneralAppFailureResponse(response)) {
            return response;
        }

        const user: User = response.data;
        if(!user) {
            let authError: AuthError = new Error('Invalid email') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: HttpStatusCode.UNAUTHORIZED,
                businessMessage: 'Invalid email',
                success: false
            };
        }

        const isPasswordMatched = await comparePassword(userData.password, user.password);
        if (isPasswordMatched) {
            let {password, ...userDataResponse} = user;
            let generateTokenOutput: GeneralAppResponse<string> = generateJWTToken(userDataResponse.id);
            if(isGeneralAppFailureResponse(generateTokenOutput)) {
                return generateTokenOutput;
            }
            return {
                data: {
                    ...userDataResponse,
                    token: generateTokenOutput.data
                },
                success: true
            };
        } else {
            const authError: AuthError = new Error('Invalid password') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: HttpStatusCode.UNAUTHORIZED,
                businessMessage: 'Invalid password',
                success: false
            };
        }
    }
    // Todo User -> User[]
    public static async findAllUsers(): Promise<GeneralAppResponse<User[]>> {
        return await UserService.userRepository.findAll();
    }

    public static async findUserByToken(token: string | undefined): Promise<GeneralAppResponse<Omit<UserAuthData, "password">>> {

        if(!token) {
            const authError: AuthError = new Error('Token not provided') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: HttpStatusCode.UNAUTHORIZED,
                businessMessage: 'Token not provided',
                success: false
            };
        }

        const userIdResponse : GeneralAppResponse<string> = getUserIdFromToken(token);
        if(isGeneralAppFailureResponse(userIdResponse)) {
            return userIdResponse;
        }

        const userId : string = userIdResponse.data;
        let response: GeneralAppResponse<User> = await UserService.userRepository.findById(userId); 

        if(isGeneralAppFailureResponse(response)) {
            return response;
        }

        let {password, ...userDataResponse} = response.data;
        return {
            data: {
                ...userDataResponse,
                token: token
            },
            success: true
        };
    }
}