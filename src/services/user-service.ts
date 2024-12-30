import { UserRepository } from "../repositories/user-repository";
import { User, UserType, UserSchema, UserSearchSchema, UserSearchOptions, UserSearchParams, UserSearchParamsSchema, UserWithProfileData } from "../types/zod/user-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse, isGeneralAppFailureResponse, isGeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { hashPassword, comparePassword } from "../common/hash-util"; 
import { generateJWTToken, getUserIdFromToken } from "../common/jwt-util";
import { UserAuthData, UserAuthDataWithProfileData } from "../types/user-auth-data";
import { AuthError } from "../types/error/auth-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { DataNotFoundError } from "../types/error/data-not-found-error";
import { randomInt } from "crypto";
import RedisService from "./redis-service";
import { EmailService } from "./email-service";
import { forgotPasswordOtpTemplate } from "../templates/forgot-password-otp";
import { SortOrder } from "../types/enums/sort-order";
import { Transactional } from "../decorators/transactional";
import { PoolClient } from "pg";
import { UserProfileSchema, UserProfileType, UserProfileWithRelatedData } from "../types/zod/user-profile-entity";
import { UserProfileService } from "./user-profile-service";

export class UserService {

    private static userRepository: UserRepository = new UserRepository();
    private static emailService: EmailService = EmailService.getInstance();

    @Transactional()
    public static async createUser(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>, client?: PoolClient): Promise<GeneralAppResponse<Omit<UserAuthDataWithProfileData, "password">>> {
        
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

        let response: GeneralAppResponse<User> = await UserService.userRepository.create(user, client);
        // if failure response, return the response
        if(isGeneralAppFailureResponse(response)) {
            return response;
        }

        // Create a User Profile
        let userProfileDefaultData : Partial<UserProfileType> = {
            userId: response.data.id,
            skills: []
        };

        // Use Zod Schema to fill in default values
        const userProfileValidationResult = UserProfileSchema.omit({id: true, createdAt: true, updatedAt: true}).safeParse(userProfileDefaultData);
        if(!userProfileValidationResult.success) {
            let zodError: ZodParsingError = userProfileValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                businessMessage: 'Error Creating User Profile',
                success: false
            };
        }
        userProfileDefaultData = userProfileValidationResult.data;

        let userProfileResponse: GeneralAppResponse<UserProfileWithRelatedData> = await UserProfileService.createUserProfileWithDetails(userProfileDefaultData as Omit<UserProfileType, 'id' | 'createdAt' | 'updatedAt'>, [], [], client);
        if(isGeneralAppFailureResponse(userProfileResponse)) {
            userProfileResponse.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
            userProfileResponse.businessMessage = 'Error Creating User Profile';
            return userProfileResponse;
        }
        const {education, experience, ...userProfileData} = userProfileResponse.data;

        // Remove password from the response
        let {password, ...userDataResponse} = response.data;
        let generateTokenOutput: GeneralAppResponse<string> = generateJWTToken(userDataResponse.id);        
        if(isGeneralAppFailureResponse(generateTokenOutput)) {
            return generateTokenOutput;
        }

        return {
            data: {
                ...userDataResponse,
                token: generateTokenOutput.data,
                profile: userProfileData,
                education: education,
                experience: experience
            },
            success: true
        };
    }

    public static async loginUser(userData: Pick<UserType, 'email' | 'password'>): Promise<GeneralAppResponse<Omit<UserAuthDataWithProfileData, "password">>> {

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

        let response: GeneralAppResponse<UserWithProfileData[]> = await UserService.userRepository.findByParams({email: userData.email}, {limit: 1, page: 1, isShowUserProfileData: true, isShowUserEducationData: true, isShowUserExperienceData: true, orderBy: 'created_at', order:SortOrder.DESC});
        if(isGeneralAppFailureResponse(response)) {
            return response;
        }

        const user: UserWithProfileData = response.data[0];
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
        userSearchParams: any = {limit: "1", page: "1", isShowUserProfileData: "false", isShowUserEducationData: "false", isShowUserExperienceData: "false", orderBy: 'created_at', order:SortOrder.DESC.toString()}
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

    public static async updateByParams(userSearchFields: Partial<UserSearchOptions>, userUpdateFields: Partial<UserType>, client?: PoolClient): Promise<GeneralAppResponse<UserType[]>> {
        
        const searchValidationResult = UserSearchSchema.partial().safeParse(userSearchFields);
        if (!userSearchFields || !searchValidationResult.success) {
            let zodError: ZodParsingError = searchValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }

        const updateValidationResult = UserSchema.partial().safeParse(userUpdateFields);
        if (!userUpdateFields || !updateValidationResult.success) {
            let zodError: ZodParsingError = updateValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid update data',
                success: false
            };
        }

        // Update updatedAt as well
        updateValidationResult.data.updatedAt = new Date().toISOString();

        return await UserService.userRepository.updateByParams(searchValidationResult.data, updateValidationResult.data, client);
    }

    public static async findUserByToken(token: string | undefined): Promise<GeneralAppResponse<Omit<UserAuthDataWithProfileData, "password">>> {

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
        let response: GeneralAppResponse<UserWithProfileData[]> = await UserService.userRepository.findByParams({id: userId}, {limit: 1, page: 1, isShowUserProfileData: true, isShowUserEducationData: true, isShowUserExperienceData: true, orderBy: 'created_at', order:SortOrder.DESC});

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
    
        // Store OTP in Redis with expiry of 300 seconds
        const redisRes: GeneralAppResponse<void> = await RedisService.set(`otp:${email}`, otp, { expiresInMillis: 300000 });
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