import Currency from "../enums/currency";
import WorkModel from "../enums/work-model";
import BaseSchema from "./base-entity";
import { z } from "zod";

const UserProfileSchema = BaseSchema.merge(
    z.object({
        userId: z.string().uuid(),
        aboutMe: z.string().optional(),
        currentAddress: z.string().optional(),
        currentYearlySalary: z.number().optional(),
        currentSalaryCurrency: z.nativeEnum(Currency).optional(),
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
        resumeLink: z.string().nullable(),
        skills: z.array(z.string()).nullable(),
        activelySearching: z.boolean().nullable(),
        workLocationPreference: z.nativeEnum(WorkModel).nullable(),
    })
);

type UserProfileType = z.infer<typeof UserProfileSchema>
type UserProfileSearchOptions = z.infer<typeof UserProfileSearchSchema>

class UserProfile implements UserProfileType {

    id: string;
    userId: string;
    aboutMe: string | undefined;
    currentAddress: string | undefined;
    currentYearlySalary: number | undefined;
    currentSalaryCurrency: Currency | undefined;
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
        this.resumeLink = validatedUserProfile.resumeLink;
        this.skills = validatedUserProfile.skills;
        this.activelySearching = validatedUserProfile.activelySearching;
        this.workLocationPreference = validatedUserProfile.workLocationPreference;
        this.createdAt = validatedUserProfile.createdAt;
        this.updatedAt = validatedUserProfile.updatedAt;
    }
};

export { UserProfileSchema, UserProfileType, UserProfile, UserProfileSearchSchema, UserProfileSearchOptions };