import { User } from "../zod/user-entity";

export type UserAuthData = User & {
    token: string;
};
