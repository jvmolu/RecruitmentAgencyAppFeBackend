// src/repositories/base.repository.ts
import { Pool, QueryResult } from 'pg';
import pool from '../db-connection/connect';
import { DatabaseErrorHandler } from '../error-handlers.ts/database-error-handler';
import { DatabaseError } from '../types/error/database-error';
import { GeneralAppResponse } from '../types/response/general-app-response';

export abstract class BaseRepository {

  protected pool: Pool;

  constructor() {
    this.pool = pool;
  }

  protected async executeQuery<T>(
    query: string, 
    params?: any[]
  ): Promise<GeneralAppResponse<T>> {
    try {
      const result: QueryResult = await this.pool.query(query, params);
      return { data: result.rows as T, success: true } as GeneralAppResponse<T>;
    } catch (error: any) {
      return DatabaseErrorHandler.handle(error) as GeneralAppResponse<T>;
    }
  }
}