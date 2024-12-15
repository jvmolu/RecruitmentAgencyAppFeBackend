// src/repositories/base.repository.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import pool from '../db-connection/pg-connect';
import { DatabaseErrorHandler } from '../error-handlers/database-error-handler';
import { GeneralAppResponse } from '../types/response/general-app-response';
import DbTable from '../types/enums/db-table';
import { SchemaMapper } from './table-entity-mapper/schema-mapper';

export abstract class BaseRepository {

  protected tableName: DbTable;
  public static pool: Pool = pool;

  constructor(tableName: DbTable) {
    this.tableName = tableName;
  }

  protected async executeQuery<T>(
    query: string, 
    params?: any[],
    client?: PoolClient
  ): Promise<GeneralAppResponse<T[]>> {
    const clientToUse = client || BaseRepository.pool;
    try {
      const dbResult: QueryResult = await clientToUse.query(query, params);
      const convertedRows: T[] = dbResult.rows.map(row => SchemaMapper.toEntity<T>(this.tableName, row));
      return { data: convertedRows, success: true } as GeneralAppResponse<T[]>;
    } catch (error: any) {
      return DatabaseErrorHandler.handle(error) as GeneralAppResponse<T[]>;
    }
  }
}