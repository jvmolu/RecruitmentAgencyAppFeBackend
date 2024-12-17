import Currency from "../enums/currency";
import WorkModel from "../enums/work-model";
import BaseSchema, { BaseSearchParams } from "./base-entity";
import { z } from "zod";
import { UserEducationType } from "./user-education-entity";
import { UserType } from "./user-entity";
import { UserExperienceType } from "./user-experience-entity";

const UserProfileSchema = BaseSchema.merge(
    z.object({
        userId: z.string().uuid(),
        aboutMe: z.string().optional(),
        currentAddress: z.string().optional(),
        currentYearlySalary: z.number().optional(),
        currentSalaryCurrency: z.nativeEnum(Currency).optional(),
        countryCode: z.string().min(1, 'Country code must be at least 1 character').max(10, 'Country code must be at most 10 characters').optional(),
        phone: z.number().min(1000000000, 'Phone number must be at least 10 digits').max(9999999999, 'Phone number must be at most 10 digits').optional(),
        resumeLink: z.string().optional(),
        skills: z.array(z.string()).optional().default([]),
        activelySearching: z.boolean().default(true),
        workLocationPreference: z.nativeEnum(WorkModel).default(WorkModel.ONSITE),
    })
);

const UserProfileSearchSchema = BaseSchema.merge(
    z.object({
        userId: z.string().uuid().nullable(),
        aboutMe: z.string().nullable(),
        currentAddress: z.string().nullable(),
        currentYearlySalary: z.number().nullable(),
        currentSalaryCurrency: z.nativeEnum(Currency).nullable(),
        countryCode: z.string().min(1, 'Country code must be at least 1 character').max(10, 'Country code must be at most 10 characters').nullable(),
        phone: z.number().min(1000000000, 'Phone number must be at least 10 digits').max(9999999999, 'Phone number must be at most 10 digits').nullable(),
        resumeLink: z.string().nullable(),
        skills: z.array(z.string()).nullable(),
        activelySearching: z.boolean().nullable(),
        workLocationPreference: z.nativeEnum(WorkModel).nullable(),
    })
);

const UserProfileSearchParamsSchema = BaseSearchParams.merge(
  z.object({
      // I will recieve strings and hence I need transformations which will convert the string to boolean
      isShowUserData: z.string().default('true').transform((val) => val === 'true'), // boolean
      isShowUserEducationData: z.string().default('true').transform((val) => val === 'true'), // boolean
      isShowUserExperienceData: z.string().default('true').transform((val) => val === 'true') // boolean
  })
);

type UserProfileType = z.infer<typeof UserProfileSchema>
type UserProfileSearchOptions = z.infer<typeof UserProfileSearchSchema>
type UserProfileSearchParams = z.infer<typeof UserProfileSearchParamsSchema>
type UserProfileWithRelatedData = UserProfileType & { user: Partial<UserType> | undefined, education: Partial<UserEducationType> | undefined, experience: Partial<UserExperienceType> | undefined }

class UserProfile implements UserProfileType {

    id: string;
    userId: string;
    aboutMe: string | undefined;
    currentAddress: string | undefined;
    currentYearlySalary: number | undefined;
    currentSalaryCurrency: Currency | undefined;
    countryCode: string | undefined;
    phone: number | undefined;
    resumeLink: string | undefined;
    skills: string[];
    activelySearching: boolean;
    workLocationPreference: WorkModel;
    createdAt: string;
    updatedAt: string;

    constructor(userProfileData: UserProfileType) {

        // This will throw if validation fails
        const validatedUserProfile = UserProfileSchema.parse(userProfileData);

        this.id = validatedUserProfile.id;
        this.userId = validatedUserProfile.userId;
        this.aboutMe = validatedUserProfile.aboutMe;
        this.currentAddress = validatedUserProfile.currentAddress;
        this.currentYearlySalary = validatedUserProfile.currentYearlySalary;
        this.currentSalaryCurrency = validatedUserProfile.currentSalaryCurrency;
        this.countryCode = validatedUserProfile.countryCode;
        this.phone = validatedUserProfile.phone;
        this.resumeLink = validatedUserProfile.resumeLink;
        this.skills = validatedUserProfile.skills;
        this.activelySearching = validatedUserProfile.activelySearching;
        this.workLocationPreference = validatedUserProfile.workLocationPreference;
        this.createdAt = validatedUserProfile.createdAt;
        this.updatedAt = validatedUserProfile.updatedAt;
    }
};

export {
    UserProfileSchema,
    UserProfileType,
    UserProfile,
    UserProfileSearchSchema,
    UserProfileSearchOptions,
    UserProfileSearchParamsSchema,
    UserProfileSearchParams,
    UserProfileWithRelatedData
};