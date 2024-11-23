import BaseSchema from "./base-entity";
import Role from "../../enums/role";
import Status from "../../enums/status";
import { z } from "zod";

// Define the schema for the User model
const UserSchema = BaseSchema.merge(
  z.object({
    firstName: z.string().min(1, 'First name must be at least 1 character'),
    lastName: z.string().min(1, 'Last name must be at least 1 character'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.number().min(1000000000, 'Phone number must be at least 10 digits').max(9999999999, 'Phone number must be at most 10 digits'),
    role: z.nativeEnum(Role).default(Role.CANDIDATE), // If the role is not provided, default to Candidate
    status: z.nativeEnum(Status).default(Status.INACTIVE), // If the status is not provided, default to Active
  })
);

type UserType = z.infer<typeof UserSchema>

class User implements UserType {

  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: number;
  role: Role;
  status: Status;
  createdAt: string;
  updatedAt: string;

  constructor(userData: UserType) {

    // This will throw if validation fails
    const validatedUser = UserSchema.parse(userData);

    this.id = validatedUser.id;
    this.firstName = validatedUser.firstName;
    this.lastName = validatedUser.lastName;
    this.email = validatedUser.email;
    this.password = validatedUser.password;
    this.phone = validatedUser.phone;
    this.role = validatedUser.role;
    this.status = validatedUser.status;
    this.createdAt = validatedUser.createdAt;
    this.updatedAt = validatedUser.updatedAt;
  }
}

export { UserSchema, UserType, User };