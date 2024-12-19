import { z } from "zod";
import BaseSchema from "./base-entity";

const UserEducationSchema = BaseSchema.merge(
  z.object({
    userProfileId: z.string().uuid(),
    course: z.string().min(1),
    institute: z.string().min(1, 'Institute name must be at least 1 character'),
    cgpa: z.number().optional(),
    passingYear: z.number().int()
  })
);

const UserEducationSearchSchema = BaseSchema.merge(
    z.object({
        userProfileId: z.string().uuid().nullable(),
        course: z.string().nullable(),
        institute: z.string().nullable(),
        cgpa: z.number().nullable(),
        passingYear: z.number().int().nullable(),
        idNotIn: z.array(z.string()).nullable()
    })
);

type UserEducationType = z.infer<typeof UserEducationSchema>;
type UserEducationSearchOptions = z.infer<typeof UserEducationSearchSchema>;

class UserEducation implements UserEducationType {

  id: string;
  userProfileId: string;
  course: string;
  institute: string;
  cgpa: number | undefined;
  passingYear: number;
  createdAt: string;
  updatedAt: string;

  constructor(userEducationData: UserEducationType) {

    // This will throw if validation fails
    const validatedUserEducation = UserEducationSchema.parse(userEducationData);

    this.id = validatedUserEducation.id;
    this.userProfileId = validatedUserEducation.userProfileId;
    this.course = validatedUserEducation.course;
    this.institute = validatedUserEducation.institute;
    this.cgpa = validatedUserEducation.cgpa;
    this.passingYear = validatedUserEducation.passingYear;
    this.createdAt = validatedUserEducation.createdAt;
    this.updatedAt = validatedUserEducation.updatedAt;
  }
};

export { UserEducationSchema, UserEducationType, UserEducation, UserEducationSearchSchema, UserEducationSearchOptions };