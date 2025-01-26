// src/types/zod/match-entity.ts
import BaseSchema, { BaseSearchParams } from "./base-entity";
import { z } from "zod";
import { UserProfileWithRelatedData } from "./user-profile-entity";
import { JobWithCompanyData } from "./job-entity";
import { MatchReportType } from "./match-report-entity";
import { UserWithProfileData } from "./user-entity";

const MatchSchema = BaseSchema.merge(
  z.object({
    matchReportId: z.string().uuid().optional(),
    jobId: z.string().uuid(),
    candidateId: z.string().uuid(),
    similarityScore: z.number().int().optional(),
  })
);

const MatchSearchSchema = BaseSchema.merge(
  z.object({
    matchReportId: z.string().uuid().nullable(),
    jobId: z.string().uuid().nullable(),
    candidateId: z.string().uuid().nullable(),
  })
);

const MatchSearchParamsSchema = BaseSearchParams.merge(
  z.object({
      // I will recieve strings and hence I need transformations which will convert the string to boolean
      // isShowJobData: z.string().default('true').transform((val) => val === 'true'), // boolean
      // isShowCandidateData: z.string().default('true').transform((val) => val === 'true'), // boolean
      // isShowReport: z.string().default('true').transform((val) => val === 'true'), // boolean

      isShowJobData: z
        .union([z.boolean(), z.string()])
        .default(true)
        .transform((val) => (typeof val === "string" ? val === "true" : val)),

      isShowCandidateData: z
        .union([z.boolean(), z.string()])
        .default(true)
        .transform((val) => (typeof val === "string" ? val === "true" : val)),

      isShowReport: z
        .union([z.boolean(), z.string()])
        .default(true)
        .transform((val) => (typeof val === "string" ? val === "true" : val)),
  })
);

type MatchType = z.infer<typeof MatchSchema>;
type MatchSearchOptions = z.infer<typeof MatchSearchSchema>;
type MatchSearchParams = z.infer<typeof MatchSearchParamsSchema>;
type MatchWithRelatedData = MatchType & { job : Partial<JobWithCompanyData> | undefined, candidate: Partial<UserWithProfileData> | undefined, report: MatchReportType | undefined }

class Match implements MatchType {
  id: string;
  matchReportId?: string;
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

export { MatchSchema, MatchType, Match, MatchSearchSchema, MatchSearchOptions, MatchSearchParamsSchema, MatchSearchParams, MatchWithRelatedData };