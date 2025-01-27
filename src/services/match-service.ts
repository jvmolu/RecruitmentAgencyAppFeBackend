// src/services/match-service.ts
import { MatchRepository } from "../repositories/match-repository";
import { MatchType, MatchSchema, MatchSearchOptions, MatchSearchSchema, MatchSearchParams, MatchSearchParamsSchema, MatchWithRelatedData } from "../types/zod/match-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";
import { PoolClient } from "pg";

export class MatchService {
  private static repository = new MatchRepository();

  public static async createMatch(data: Omit<MatchType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<MatchType>> {
    let match: MatchType = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };

    const validationResult = MatchSchema.safeParse(match);
    if (!validationResult.success) {
      const error = validationResult.error as ZodParsingError;
      error.errorType = 'ZodParsingError';
      return {
        error,
        statusCode: HttpStatusCode.BAD_REQUEST,
        businessMessage: 'Invalid match data',
        success: false,
      };
    }

    return await this.repository.create(validationResult.data);
  }

  public static async createMatchesInBulk(matches: Partial<MatchType>[], client?: PoolClient): Promise<GeneralAppResponse<MatchType[]>> {

    matches = matches.map((match) => ({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...match,
    }));

    const validationResult = MatchSchema.array().safeParse(matches);
    if (!validationResult.success) {
      const error = validationResult.error as ZodParsingError;
      error.errorType = 'ZodParsingError';
      return {
        error,
        statusCode: HttpStatusCode.BAD_REQUEST,
        businessMessage: 'Invalid match data',
        success: false,
      };
    }

    return await this.repository.createMatchesInBulk(validationResult.data, client);
  }

  public static async findByParams(
    matchSearchOptions: Partial<MatchSearchOptions>,
    matchSearchParams: Partial<MatchSearchParams>
  ): Promise<GeneralAppResponse<MatchWithRelatedData[]>> {

    const validationResult = MatchSearchSchema.partial().safeParse(matchSearchOptions);
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

    const searchParamsValidationResult = MatchSearchParamsSchema.safeParse(matchSearchParams);
    if (!searchParamsValidationResult.success) {
      const error = searchParamsValidationResult.error as ZodParsingError;
      error.errorType = 'ZodParsingError';
      return {
        error,
        statusCode: HttpStatusCode.BAD_REQUEST,
        businessMessage: 'Invalid search parameters',
        success: false,
      };
    }

    return await this.repository.findByParams(validationResult.data, searchParamsValidationResult.data as MatchSearchParams);
  }

  private static async deleteByParams(matchSearchOptions: Partial<MatchSearchOptions>): Promise<GeneralAppResponse<MatchType[]>> {
    const validationResult = MatchSearchSchema.partial().safeParse(matchSearchOptions);
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

    return await this.repository.deleteByParams(validationResult.data);
  }
}