import { User } from "../zod/user-entity";

export type UserAuthData = {
    user: User;  // Replace with your User type
    token: string;
};
