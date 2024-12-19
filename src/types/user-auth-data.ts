import { UserEducationType } from "./zod/user-education-entity";
import { User } from "./zod/user-entity";
import { UserExperienceType } from "./zod/user-experience-entity";
import { UserProfileType } from "./zod/user-profile-entity";

export type UserAuthData = User & {
    token: string;
};

export type UserAuthDataWithProfileData = UserAuthData & {
    profile: Partial<UserProfileType> | undefined;
    education: Partial<UserEducationType> | undefined;
    experience: Partial<UserExperienceType> | undefined;
};
