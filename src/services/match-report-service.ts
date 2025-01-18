// src/services/match-report-service.ts
import { MatchReportRepository } from "../repositories/match-report-repository";
import { MatchReportType, MatchReportSchema, MatchReportSearchOptions, MatchReportSearchSchema } from "../types/zod/match-report-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { PoolClient } from "pg";

export class MatchReportService {
  private static repository = new MatchReportRepository();

  public static async createMatchReport(data: Omit<MatchReportType, 'id' | 'createdAt' | 'updatedAt'>, client?: PoolClient): Promise<GeneralAppResponse<MatchReportType>> {
    let matchReport: MatchReportType = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };

    const validationResult = MatchReportSchema.safeParse(matchReport);
    if (!validationResult.success) {
      const error = validationResult.error as ZodParsingError;
      error.errorType = 'ZodParsingError';
      return {
        error,
        statusCode: HttpStatusCode.BAD_REQUEST,
        businessMessage: 'Invalid match report data',
        success: false,
      };
    }

    return await this.repository.create(validationResult.data, client);
  }

  public static async findByParams(params: Partial<MatchReportSearchOptions>): Promise<GeneralAppResponse<MatchReportType[]>> {
    const validationResult = MatchReportSearchSchema.safeParse(params);
    if (!validationResult.success) {
      const error = validationResult.error as ZodParsingError;
      error.errorType = 'ZodParsingError';
      return {
        error,
        statusCode: HttpStatusCode.BAD_REQUEST,
        businessMessage: 'Invalid search parameters',
        success: false,
      };
    }

    return await this.repository.findByParams(validationResult.data);
  }
}