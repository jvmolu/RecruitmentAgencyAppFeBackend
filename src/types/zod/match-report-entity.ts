// src/types/zod/match-report-entity.ts
import BaseSchema from "./base-entity";
import { z } from "zod";

const MatchReportSchema = BaseSchema.merge(
  z.object({
    // JSON FIELD
    report: z.any(),
  })
);

const MatchReportSearchSchema = BaseSchema.merge(
  z.object({
    report: z.any().nullable(),
  })
);

type MatchReportType = z.infer<typeof MatchReportSchema>;
type MatchReportSearchOptions = z.infer<typeof MatchReportSearchSchema>;

class MatchReport implements MatchReportType {
  id: string;
  report: any;
  createdAt: string;
  updatedAt: string;

  constructor(data: MatchReportType) {
    const validatedData = MatchReportSchema.parse(data);
    this.id = validatedData.id;
    this.report = validatedData.report;
    this.createdAt = validatedData.createdAt;
    this.updatedAt = validatedData.updatedAt;
  }
}

export { MatchReportSchema, MatchReportType, MatchReport, MatchReportSearchSchema, MatchReportSearchOptions };