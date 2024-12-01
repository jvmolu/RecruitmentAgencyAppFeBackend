// src/services/match-service.ts
import { MatchRepository } from "../repositories/match-repository";
import { MatchType, MatchSchema, MatchSearchOptions, MatchSearchSchema } from "../types/zod/match-entity";
import { v4 as uuidv4 } from 'uuid';
import { GeneralAppResponse } from "../types/response/general-app-response";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import HttpStatusCode from "../types/enums/http-status-codes";

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

  public static async findByParams(params: Partial<MatchSearchOptions>): Promise<GeneralAppResponse<MatchType[]>> {
    const validationResult = MatchSearchSchema.safeParse(params);
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