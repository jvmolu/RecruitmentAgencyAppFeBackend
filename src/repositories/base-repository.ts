// src/repositories/base.repository.ts
import { Pool, QueryResult } from 'pg';
import pool from '../db-connection/connect';
import { DatabaseErrorHandler } from '../types/error/database-error-handler';
import { IDatabaseError } from '../types/error/i-database-error';

export abstract class BaseRepository {

  protected pool: Pool;

  constructor() {
    this.pool = pool;
  }

  protected async executeQuery<T>(
    query: string, 
    params?: any[]
  ): Promise<{output: T, success: true} | {error: IDatabaseError, success: false}> {
    try {
      const result: QueryResult = await this.pool.query(query, params);
      return { output: result.rows as T, success: true };
    } catch (error: any) {
      return { error: DatabaseErrorHandler.handle(error), success: false };
    }
  }
}