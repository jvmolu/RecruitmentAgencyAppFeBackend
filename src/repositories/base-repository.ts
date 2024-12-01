// src/repositories/base.repository.ts
import { Pool, QueryResult } from 'pg';
import pool from '../db-connection/pg-connect';
import { DatabaseErrorHandler } from '../error-handlers.ts/database-error-handler';
import { GeneralAppResponse } from '../types/response/general-app-response';
import DbTable from '../types/enums/db-table';
import { SchemaMapper } from './table-entity-mapper/schema-mapper';

export abstract class BaseRepository {

  protected tableName: DbTable;
  protected static pool: Pool = pool;

  constructor(tableName: DbTable) {
    this.tableName = tableName;
  }

  protected async executeQuery<T>(
    query: string, 
    params?: any[]
  ): Promise<GeneralAppResponse<T[]>> {
    try {
      const dbResult: QueryResult = await pool.query(query, params);
      const convertedRows: T[] = dbResult.rows.map(row => SchemaMapper.toEntity<T>(this.tableName, row));
      return { data: convertedRows, success: true } as GeneralAppResponse<T[]>;
    } catch (error: any) {
      return DatabaseErrorHandler.handle(error) as GeneralAppResponse<T[]>;
    }
  }
}