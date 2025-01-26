import { UserProfileRepository } from "../repositories/user-profile-repository";
import {
	UserProfileType,
	UserProfileSchema,
	UserProfileSearchOptions,
	UserProfileSearchSchema,
	UserProfile,
	UserProfileSearchParams,
	UserProfileWithRelatedData,
	UserProfileSearchParamsSchema,
} from "../types/zod/user-profile-entity";
import { v4 as uuidv4 } from "uuid";
import {
	GeneralAppResponse,
	isGeneralAppFailureResponse,
} from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { Transactional } from "../decorators/transactional";
import { UserEducationType } from "../types/zod/user-education-entity";
import { UserExperienceType } from "../types/zod/user-experience-entity";
import { PoolClient } from "pg";
import { UserEducationService } from "./user-education-service";
import { UserExperienceService } from "./user-experiences-service";
import { BadRequestError } from "../types/error/bad-request-error";
import S3Service from "./aws-service";
import { UserSearchOptions, UserType } from "../types/zod/user-entity";
import { UserService } from "./user-service";
import axios from "axios";
import AiService from "./ai-service";
import { extractTextFromPDF } from "../common/pdf-util";
import { GeneralAppError } from "../types/error/general-app-error";

export class UserProfileService {

    private static userProfileRepository: UserProfileRepository = new UserProfileRepository();
    private static s3Service: S3Service = S3Service.getInstance();
	private static AI_SERVICE_URL =
		process.env.AI_SERVICE_URL || "http://localhost:8000";

    public static async downloadFile(bucketName: string, fileUrl: string): Promise<GeneralAppResponse<Buffer>> {
        return await this.s3Service.downloadFile(bucketName, fileUrl);
    }

	@Transactional()
	public static async createUserProfileWithDetails(
		profileData: Omit<UserProfileType, "id" | "createdAt" | "updatedAt">,
		educationData: Omit<
			UserEducationType,
			"id" | "userProfileId" | "createdAt" | "updatedAt"
		>[],
		experienceData: Omit<
			UserExperienceType,
			"id" | "userProfileId" | "createdAt" | "updatedAt"
		>[],
		client?: PoolClient
	): Promise<GeneralAppResponse<any>> {
		const userProfile: UserProfileType = {
			id: uuidv4(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			...profileData,
		};

		const validationResult = UserProfileSchema.safeParse(userProfile);
		if (!validationResult.success) {
			let zodError: ZodParsingError = validationResult.error as ZodParsingError;
			zodError.errorType = "ZodParsingError";
			return {
				error: zodError,
				statusCode: HttpStatusCode.BAD_REQUEST,
				businessMessage: "Invalid user profile data",
				success: false,
			};
		}

		const userProfileResult: GeneralAppResponse<UserProfile> =
			await this.userProfileRepository.create(validationResult.data, client);
		if (isGeneralAppFailureResponse(userProfileResult)) {
			return userProfileResult;
		}

		const userProfileId: string = userProfileResult.data.id;
		const educationHistoriesToCreate: Omit<
			UserEducationType,
			"id" | "createdAt" | "updatedAt"
		>[] = educationData.map((education) => {
			return {
				...education,
				userProfileId,
			};
		});
		const experienceHistoriesToCreate: Omit<
			UserExperienceType,
			"id" | "createdAt" | "updatedAt"
		>[] = experienceData.map((experience) => {
			return {
				...experience,
				userProfileId,
			};
		});

		const educationResults: GeneralAppResponse<UserEducationType[]> =
			await UserEducationService.createUserEducationBulk(
				educationHistoriesToCreate,
				client
			);
		if (isGeneralAppFailureResponse(educationResults)) {
			return educationResults;
		}
		const experienceResults: GeneralAppResponse<UserExperienceType[]> =
			await UserExperienceService.createUserExperienceBulk(
				experienceHistoriesToCreate,
				client
			);
		if (isGeneralAppFailureResponse(experienceResults)) {
			return experienceResults;
		}

		return {
			success: true,
			data: {
				userProfile: userProfileResult.data,
				education: educationResults.data,
				experience: experienceResults.data,
			},
		};
	}

	public static async updateUserProfileWithDetails(
		profileSearchFields: Partial<UserProfileSearchOptions>,
		userUpdateFields: Partial<UserType>,
		profileUpdateFields: Partial<UserProfileType>,
		educationData: Partial<UserEducationType>[],
		experienceData: Partial<UserExperienceType>[],
		client?: PoolClient
	): Promise<GeneralAppResponse<any>> {
		// Validate profile search fields
		const searchValidationResult =
			UserProfileSearchSchema.partial().safeParse(profileSearchFields);
		if (!searchValidationResult.success) {
			let zodError: ZodParsingError =
				searchValidationResult.error as ZodParsingError;
			zodError.errorType = "ZodParsingError";
			return {
				error: zodError,
				statusCode: HttpStatusCode.BAD_REQUEST,
				businessMessage: "Invalid search parameters",
				success: false,
			};
		}

        // Validate profile update fields
        const updateValidationResult = UserProfileSchema.partial().safeParse(profileUpdateFields);
        if (!updateValidationResult.success) {
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

		// Validate and update user profile
		const userProfileResult = await this.userProfileRepository.updateByParams(
			searchValidationResult.data,
			updateValidationResult.data,
			client
		);
		if (isGeneralAppFailureResponse(userProfileResult)) {
			return userProfileResult;
		}

		if (userProfileResult.data.length === 0) {
			const notFoundError: BadRequestError = new Error(
				"No user profile found for the given search parameters"
			) as BadRequestError;
			notFoundError.errorType = "BadRequestError";
			return {
				success: false,
				error: notFoundError,
				statusCode: HttpStatusCode.NOT_FOUND,
				businessMessage:
					"No user profile found for the given search parameters",
			};
		}

		// If Education and Experience data is provided, then ONLY 1 User Profile record should be updated
		if (userProfileResult.data.length > 1) {
			const badRequestError: BadRequestError = new Error(
				"Multiple user profiles found for the given search parameters, ambiguity in updating education and experience records"
			) as BadRequestError;
			badRequestError.errorType = "BadRequestError";
			return {
				success: false,
				error: badRequestError,
				statusCode: HttpStatusCode.BAD_REQUEST,
				businessMessage:
					"Multiple user profiles found for the given search parameters, ambiguity in updating education and experience records",
			};
		}

		// Hence fetching the first record
		const userProfileId: string = userProfileResult.data[0].id;
		const userId: string = userProfileResult.data[0].userId;

		// Update user data using UserService
		const userSearchFields: Partial<UserSearchOptions> = { id: userId };
		const userUpdateResult = await UserService.updateByParams(
			userSearchFields,
			userUpdateFields,
			client
		);
		if (isGeneralAppFailureResponse(userUpdateResult)) {
			return userUpdateResult;
		}

		// Updating Education Data
		// Segregate Records to be created vs updated
		let newEducationHistories: any[] = []; // Education history parsing errors are handled in the service
		let educationDataToBeUpdated: Partial<UserEducationType>[] = [];
		educationData.map((education) => {
			if (education.id) {
				educationDataToBeUpdated.push(education);
			} else {
				newEducationHistories.push({
					...education,
					userProfileId,
				});
			}
		});

		let educationUpdatedData: UserEducationType[] = [];

		// Create new records
		let educationResults: GeneralAppResponse<UserEducationType[]>;
		if (newEducationHistories.length > 0) {
			educationResults = await UserEducationService.createUserEducationBulk(
				newEducationHistories,
				client
			);
			if (isGeneralAppFailureResponse(educationResults)) {
				return educationResults;
			}
			educationUpdatedData.push(...educationResults.data);
		}

		// Update existing records
		if (educationDataToBeUpdated.length > 0) {
			const educationUpdatePromises: Promise<
				GeneralAppResponse<UserEducationType[]>
			>[] = educationDataToBeUpdated.map((education) => {
				return UserEducationService.updateUserEducations(
					{ id: education.id },
					education,
					client
				);
			});
			const educationUpdateResults = await Promise.all(educationUpdatePromises);
			educationUpdateResults.forEach((result) => {
				if (isGeneralAppFailureResponse(result)) {
					return result;
				}
				educationUpdatedData.push(...result.data);
			});
		}

		// Delete Education Records
		let allPresentEducationIds: string[] = educationUpdatedData.map(
			(edu) => edu.id
		);
		let deleteResponse = await UserEducationService.deleteUserEducations(
			{ userProfileId: userProfileId, idNotIn: allPresentEducationIds },
			client
		);
		if (isGeneralAppFailureResponse(deleteResponse)) {
			return deleteResponse;
		}

		// Update experience records

		// Segregate Records to be created vs updated
		let newExperienceHistories: any[] = []; // Experience history parsing errors are handled in the service
		let experienceDataToBeUpdated: Partial<UserExperienceType>[] = [];
		experienceData.map((experience) => {
			if (experience.id) {
				experienceDataToBeUpdated.push(experience);
			} else {
				newExperienceHistories.push({
					...experience,
					userProfileId,
				});
			}
		});

		let experienceUpdatedData: UserExperienceType[] = [];

		// Create new records
		let experienceResults: GeneralAppResponse<UserExperienceType[]>;
		if (newExperienceHistories.length > 0) {
			experienceResults = await UserExperienceService.createUserExperienceBulk(
				newExperienceHistories,
				client
			);
			if (isGeneralAppFailureResponse(experienceResults)) {
				return experienceResults;
			}
			experienceUpdatedData.push(...experienceResults.data);
		}

		// Update existing records
		if (experienceDataToBeUpdated.length > 0) {
			const experienceUpdatePromises: Promise<
				GeneralAppResponse<UserExperienceType[]>
			>[] = experienceDataToBeUpdated.map((experience) => {
				return UserExperienceService.updateUserExperiences(
					{ id: experience.id },
					experience,
					client
				);
			});
			const experienceUpdateResults = await Promise.all(
				experienceUpdatePromises
			);
			experienceUpdateResults.forEach((result) => {
				if (isGeneralAppFailureResponse(result)) {
					return result;
				}
				experienceUpdatedData.push(...result.data);
			});
		}

		// Delete Experience Records
		let allPresentExperienceIds: string[] = experienceUpdatedData.map(
			(exp) => exp.id
		);
		let deleteExperienceResponse =
			await UserExperienceService.deleteUserExperiences(
				{ userProfileId: userProfileId, idNotIn: allPresentExperienceIds },
				client
			);
		if (isGeneralAppFailureResponse(deleteExperienceResponse)) {
			return deleteExperienceResponse;
		}

		return {
			success: true,
			data: {
				userProfile: userProfileResult.data,
				education: educationUpdatedData,
				experience: experienceUpdatedData,
				user: userUpdateResult.data,
			},
		};
	}

	public static async findByParams(
		profileFields: Partial<UserProfileSearchOptions>,
		profileSearchParams: Partial<UserProfileSearchParams>
	): Promise<GeneralAppResponse<UserProfileWithRelatedData[]>> {
		const validationResult =
			UserProfileSearchSchema.partial().safeParse(profileFields);
		if (!validationResult.success) {
			let zodError: ZodParsingError = validationResult.error as ZodParsingError;
			zodError.errorType = "ZodParsingError";
			return {
				error: zodError,
				statusCode: HttpStatusCode.BAD_REQUEST,
				businessMessage: "Invalid search parameters",
				success: false,
			};
		}

		const searchParams =
			UserProfileSearchParamsSchema.safeParse(profileSearchParams);
		if (!searchParams.success) {
			let zodError: ZodParsingError = searchParams.error as ZodParsingError;
			zodError.errorType = "ZodParsingError";
			return {
				error: zodError,
				statusCode: HttpStatusCode.BAD_REQUEST,
				businessMessage: "Invalid search parameters",
				success: false,
			};
		}

		return await this.userProfileRepository.findByParams(
			validationResult.data,
			searchParams.data as UserProfileSearchParams
		);
	}

	/**
	 * @method uploadResume
	 * @description Handles the upload of a resume file to DigitalOcean Spaces.
	 * @param file - The file to be uploaded.
	 * @param bucketName - The name of the bucket to upload the file to.
	 * @param userId - The identifier for the user.
	 * @returns Promise resolving to a GeneralAppResponse containing the file URL or an error.
	 **/
	public static async uploadResume(
		bucketName: string,
		userId: string,
		file: Express.Multer.File
	): Promise<GeneralAppResponse<string>> {
		const fileUrl: string = `/cand/user-profiles/${userId}/resume.pdf`;

		// Upload to DigitalOcean
		const uploadResult: GeneralAppResponse<void> =
			await this.s3Service.uploadFile(bucketName, fileUrl, file.buffer);

		if (isGeneralAppFailureResponse(uploadResult)) {
			return {
				success: false,
				businessMessage: uploadResult.businessMessage,
				error: uploadResult.error,
				statusCode: uploadResult.statusCode,
			};
		}

		return {
			success: true,
			data: fileUrl,
		};
	}

	public static async uploadResumeAndUpdateEmbedding(
		bucketName: string,
		userId: string,
		file: Express.Multer.File
	): Promise<GeneralAppResponse<{
		userId: string,
		embedding: number[],
		fileUrl: string
	}>> {
		try {

			const uploadResumeResult = await this.uploadResume(bucketName, userId, file);
			if (isGeneralAppFailureResponse(uploadResumeResult)) {
				return uploadResumeResult;
			}

			// Extract File Text
			const text: string = await extractTextFromPDF(file.buffer);
			if (!text) {
				return {
					success: false,
					businessMessage: "Error extracting text from PDF",
					error: new Error("Error extracting text from PDF") as GeneralAppError,
					statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
				};
			}

			// Call AI Service to update the embedding
			const embeddingResult: GeneralAppResponse<{
				userId: string;
				embedding: number[];
			}> = await AiService.generateProfileEmbedding(text, userId);
			if (isGeneralAppFailureResponse(embeddingResult)) {
				return embeddingResult;
			}

			return {
				success: true,
				data: {
					userId: embeddingResult.data.userId,
					embedding: embeddingResult.data.embedding,
					fileUrl: uploadResumeResult.data,
				},
			};

		} catch (error: any) {
			console.error(error);
			return {
				success: false,
				businessMessage: "Internal server error",
				error,
				statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
			};
		}
	}
}
