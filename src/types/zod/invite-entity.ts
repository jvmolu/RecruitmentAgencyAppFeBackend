// src/types/zod/invite-entity.ts
import BaseSchema, { BaseSearchParams } from "./base-entity";
import { z } from "zod";

const InviteSchema = BaseSchema.merge(
  z.object({
    jobId: z.string().uuid(),
    candidateId: z.string().uuid(),
  })
);

// Search schema with nullable fields
const InviteSearchSchema = BaseSchema.merge(
  z.object({
    jobId: z.string().uuid().nullable(),
    candidateId: z.string().uuid().nullable(),
  })
);

const InviteSearchParamsSchema = BaseSearchParams.merge(
  z.object({
      // I will recieve strings and hence I need transformations which will convert the string to boolean
      isShowJobData: z.string().default('true').transform((val) => val === 'true'), // boolean
      isShowCandidateData: z.string().default('true').transform((val) => val === 'true'), // boolean
  })
);

type InviteType = z.infer<typeof InviteSchema>
type InviteSearchOptions = z.infer<typeof InviteSearchSchema>
type InviteSearchParams = z.infer<typeof InviteSearchParamsSchema>

class Invite implements InviteType {
  
  id: string;
  jobId: string;
  candidateId: string;
  createdAt: string;
  updatedAt: string;

  constructor(inviteData: InviteType) {
    const validatedInvite = InviteSchema.parse(inviteData);
    this.id = validatedInvite.id;
    this.jobId = validatedInvite.jobId;
    this.candidateId = validatedInvite.candidateId;
    this.createdAt = validatedInvite.createdAt;
    this.updatedAt = validatedInvite.updatedAt;
  }
}

export { InviteSchema, InviteType, Invite, InviteSearchSchema, InviteSearchOptions, InviteSearchParamsSchema, InviteSearchParams };