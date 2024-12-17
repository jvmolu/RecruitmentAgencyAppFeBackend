import { UserRepository } from "../repositories/user-repository";
import { User, UserType, UserSchema, UserSearchSchema, UserSearchOptions, UserSearchParams, UserSearchParamsSchema, UserWithProfileData } from "../types/zod/user-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse, isGeneralAppFailureResponse, isGeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { hashPassword, comparePassword } from "../common/hash-util"; 
import { generateJWTToken, getUserIdFromToken } from "../common/jwt-util";
import { UserAuthData } from "../types/user-auth-data";
import { AuthError } from "../types/error/auth-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { DataNotFoundError } from "../types/error/data-not-found-error";
import { randomInt } from "crypto";
import RedisService from "./redis-service";
import { EmailService } from "./email-service";
import { forgotPasswordOtpTemplate } from "../templates/forgot-password-otp";
import { SortOrder } from "../types/enums/sort-order";

export class UserService {

    private static userRepository: UserRepository = new UserRepository();
    private static emailService: EmailService = EmailService.getInstance();

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

        let response: GeneralAppResponse<User[]> = await UserService.userRepository.findByParams({email: userData.email});
        if(isGeneralAppFailureResponse(response)) {
            return response;
        }

        const user: User = response.data[0];
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

    public static async findUsersByParams(
        userFields: Partial<UserSearchOptions>,
        userSearchParams: Partial<UserSearchParams> = {limit: 1, page: 1, isShowUserProfileData: false, orderBy: 'created_at', order:SortOrder.DESC}
    ): Promise<GeneralAppResponse<UserWithProfileData[]>> {

        const validationResult = UserSearchSchema.partial().safeParse(userFields);
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

        const searchParamsValidationResult = UserSearchParamsSchema.safeParse(userSearchParams);
        if(!searchParamsValidationResult.success) {
            let zodError: ZodParsingError = searchParamsValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid user search parameters',
                success: false
            };
        }

        return await UserService.userRepository.findByParams(validationResult.data, searchParamsValidationResult.data as UserSearchParams);
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
        let response: GeneralAppResponse<User[]> = await UserService.userRepository.findByParams({id: userId});

        if(isGeneralAppFailureResponse(response)) {
            return response;
        }

        if(response.data.length === 0) {
            const authError: AuthError = new Error('User not found') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: HttpStatusCode.UNAUTHORIZED,
                businessMessage: 'User not found',
                success: false
            };
        }

        let {password, ...userDataResponse} = response.data[0];
        return {
            data: {
                ...userDataResponse,
                token: token
            },
            success: true
        };
    }

    public static async generateOTP(email: string): Promise<GeneralAppResponse<null>> {
        
        // Validate email
        const validationResult = UserSchema.pick({ email: true }).safeParse({ email });
        if (!validationResult.success) {
          const zodError: ZodParsingError = validationResult.error as ZodParsingError;
          zodError.errorType = 'ZodParsingError';
          return {
            error: zodError,
            statusCode: HttpStatusCode.BAD_REQUEST,
            businessMessage: 'Invalid email address',
            success: false,
          };
        }
    
        // Check if user exists
        const response = await this.userRepository.findByParams({ email });
        if (isGeneralAppFailureResponse(response)) {
          return response;
        }
    
        const user = response.data[0];
        if (!user) {
          const dataNotFoundError: DataNotFoundError = new Error('User not found') as DataNotFoundError;
          dataNotFoundError.errorType = 'DataNotFoundError';
          return {
            error: dataNotFoundError,
            statusCode: HttpStatusCode.NOT_FOUND,
            businessMessage: 'User not found',
            success: false,
          };
        }
    
        // Generate OTP
        const otp = randomInt(100000, 999999).toString();
    
        // Store OTP in Redis with expiry of 180 seconds
        const redisRes: GeneralAppResponse<void> = await RedisService.set(`otp:${email}`, otp, { expiresInMillis: 180000 });
        if (isGeneralAppFailureResponse(redisRes)) {
          return redisRes;
        }

        // Send OTP to user's email
        const emailSubject = 'OTP for Resetting Password';
        const emailText = forgotPasswordOtpTemplate(otp);
        const emailRes: GeneralAppResponse<void> = await this.emailService.sendEmail(email, emailSubject, emailText);

        if (isGeneralAppFailureResponse(emailRes)) {
          return emailRes;
        }

        return {
          success: true,
          data: null,
        };
      }
    
      public static async verifyOTP(email: string, otp: string): Promise<GeneralAppResponse<null>> {
        
        // Validate email and OTP
        const emailValidation = UserSchema.pick({ email: true }).safeParse({ email });
        if (!emailValidation.success) {
          const zodError: ZodParsingError = emailValidation.error as ZodParsingError;
          zodError.errorType = 'ZodParsingError';
          return {
            error: zodError,
            statusCode: HttpStatusCode.BAD_REQUEST,
            businessMessage: 'Invalid email address',
            success: false,
          };
        }
    
        // Retrieve OTP from Redis
        const redisRes : GeneralAppResponse<string | null> = await RedisService.get(`otp:${email}`);
        if (isGeneralAppFailureResponse(redisRes)) {
          return redisRes;
        }

        const storedOtp = redisRes.data;
    
        // Check if OTP is present
        if (storedOtp === null) {
            const dataNotFoundError: DataNotFoundError = new Error('OTP expired or not found') as DataNotFoundError;
            dataNotFoundError.errorType = 'DataNotFoundError';
            return {
              error: dataNotFoundError,
              statusCode: HttpStatusCode.UNAUTHORIZED,
              businessMessage: 'OTP expired or not found',
              success: false,
            };
        }
        
        // Check if OTP is correct
        if (storedOtp !== otp) {
            const authError: AuthError = new Error('Invalid OTP') as AuthError;
            authError.errorType = 'AuthError';
            return {
                error: authError,
                statusCode: HttpStatusCode.UNAUTHORIZED,
                businessMessage: 'Invalid OTP',
                success: false,
            };
        }

        // Deleting OTP is not necessary as it will expire in 180 seconds        
        return {
            success: true,
            data: null,
        };
      }

}