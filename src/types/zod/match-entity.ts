// src/types/zod/match-entity.ts
import BaseSchema from "./base-entity";
import { z } from "zod";

const MatchSchema = BaseSchema.merge(
  z.object({
    matchReportId: z.string().uuid(),
    jobId: z.string().uuid(),
    candidateId: z.string().uuid(),
  })
);

const MatchSearchSchema = BaseSchema.merge(
  z.object({
    matchReportId: z.string().uuid().nullable(),
    jobId: z.string().uuid().nullable(),
    candidateId: z.string().uuid().nullable(),
  })
);

type MatchType = z.infer<typeof MatchSchema>;
type MatchSearchOptions = z.infer<typeof MatchSearchSchema>;

class Match implements MatchType {
  id: string;
  matchReportId: string;
  jobId: string;
  candidateId: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: MatchType) {
    const validatedData = MatchSchema.parse(data);
    this.id = validatedData.id;
    this.matchReportId = validatedData.matchReportId;
    this.jobId = validatedData.jobId;
    this.candidateId = validatedData.candidateId;
    this.createdAt = validatedData.createdAt;
    this.updatedAt = validatedData.updatedAt;
  }
}

export { MatchSchema, MatchType, Match, MatchSearchSchema, MatchSearchOptions };