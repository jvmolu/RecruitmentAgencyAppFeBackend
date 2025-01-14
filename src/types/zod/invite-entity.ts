// src/types/zod/invite-entity.ts
import InviteStatus from "../enums/invite-status";
import BaseSchema, { BaseSearchParams } from "./base-entity";
import { z } from "zod";
import { JobWithCompanyData } from "./job-entity";
import { UserWithProfileData } from "./user-entity";
import WorkModel from "../enums/work-model";
import JobsType from "../enums/job-type";

const InviteSchema = BaseSchema.merge(
  z.object({
    jobId: z.string().uuid(),
    candidateId: z.string().uuid(),
    status: z.nativeEnum(InviteStatus).default(InviteStatus.PENDING),
  })
);

// Search schema with nullable fields
const InviteSearchSchema = BaseSchema.merge(
  z.object({
    jobId: z.string().uuid().nullable(),
    candidateId: z.string().uuid().nullable(),
    status: z.nativeEnum(InviteStatus).nullable(),

    // Job Table related fields
    workModel: z.nativeEnum(WorkModel).nullable(),
    jobType: z.nativeEnum(JobsType).nullable(),
    location: z.string().nullable(),
    title: z.string().nullable(),
  })
);

const InviteSearchParamsSchema = BaseSearchParams.merge(
  z.object({
      // I will recieve strings and hence I need transformations which will convert the string to boolean
      isShowJobData: z
        .union([z.boolean(), z.string()])
        .default(true)
        .transform((val) => (typeof val === "string" ? val === "true" : val)),
      
      isShowCandidateData: z
        .union([z.boolean(), z.string()])
        .default(true)
        .transform((val) => (typeof val === "string" ? val === "true" : val)),
  })
);

type InviteType = z.infer<typeof InviteSchema>
type InviteSearchOptions = z.infer<typeof InviteSearchSchema>
type InviteSearchParams = z.infer<typeof InviteSearchParamsSchema>
type InviteWithRelatedData = InviteType & { job: Partial<JobWithCompanyData> | undefined, candidate: Partial<UserWithProfileData> | undefined };

class Invite implements InviteType {
  
  id: string;
  jobId: string;
  candidateId: string;
  status: InviteStatus;
  createdAt: string;
  updatedAt: string;

  constructor(inviteData: InviteType) {
    const validatedInvite = InviteSchema.parse(inviteData);
    this.id = validatedInvite.id;
    this.jobId = validatedInvite.jobId;
    this.candidateId = validatedInvite.candidateId;
    this.status = validatedInvite.status;
    this.createdAt = validatedInvite.createdAt;
    this.updatedAt = validatedInvite.updatedAt;
  }
}

export { InviteSchema, InviteType, Invite, InviteSearchSchema, InviteSearchOptions, InviteSearchParamsSchema, InviteSearchParams, InviteWithRelatedData };