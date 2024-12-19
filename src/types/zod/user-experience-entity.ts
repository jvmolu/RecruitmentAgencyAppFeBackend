import { z } from "zod";
import BaseSchema from "./base-entity";

const UserExperienceSchema = BaseSchema.merge(
  z.object({
    userProfileId: z.string().uuid(),
    companyName: z.string().min(1, 'Company name must be at least 1 character'),
    roleTitle: z.string().min(1, 'Role title must be at least 1 character'),
    fromDate: z.string().date(),
    toDate: z.string().date().optional(),
    description: z.string().optional(),
  })
);

const UserExperienceSearchSchema = BaseSchema.merge(
    z.object({
        userProfileId: z.string().uuid().nullable(),
        companyName: z.string().nullable(),
        roleTitle: z.string().nullable(),
        fromDate: z.string().date().nullable(),
        toDate: z.string().date().nullable(),
        description: z.string().nullable(),
        idNotIn: z.array(z.string()).nullable()
    })
);

type UserExperienceType = z.infer<typeof UserExperienceSchema>;
type UserExperienceSearchOptions = z.infer<typeof UserExperienceSearchSchema>;

class UserExperience implements UserExperienceType {

  id: string;
  userProfileId: string;
  companyName: string;
  roleTitle: string;
  fromDate: string;
  toDate: string | undefined;
  description: string | undefined;
  createdAt: string;
  updatedAt: string;

  constructor(userExperienceData: UserExperienceType) {

    // This will throw if validation fails
    const validatedUserExperience = UserExperienceSchema.parse(userExperienceData);

    this.id = validatedUserExperience.id;
    this.userProfileId = validatedUserExperience.userProfileId;
    this.companyName = validatedUserExperience.companyName;
    this.roleTitle = validatedUserExperience.roleTitle;
    this.fromDate = validatedUserExperience.fromDate;
    this.toDate = validatedUserExperience.toDate;
    this.description = validatedUserExperience.description;
    this.createdAt = validatedUserExperience.createdAt;
    this.updatedAt = validatedUserExperience.updatedAt;
  }
};

export { UserExperienceSchema, UserExperienceType, UserExperience, UserExperienceSearchSchema, UserExperienceSearchOptions };