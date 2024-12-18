import { User } from "./zod/user-entity";
import { UserProfileType } from "./zod/user-profile-entity";

export type UserAuthData = User & {
    token: string;
};

export type UserAuthDataWithProfileData = UserAuthData & {
    profile: Partial<UserProfileType> | undefined;
};
