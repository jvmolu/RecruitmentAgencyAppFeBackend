// src/types/zod/invite-entity.ts
import BaseSchema from "./base-entity";
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

type InviteType = z.infer<typeof InviteSchema>
type InviteSearchOptions = z.infer<typeof InviteSearchSchema>

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

export { InviteSchema, InviteType, Invite, InviteSearchSchema, InviteSearchOptions };