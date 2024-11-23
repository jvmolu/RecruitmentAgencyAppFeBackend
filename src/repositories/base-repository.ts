// src/repositories/base.repository.ts
import { Pool, QueryResult } from 'pg';
import pool from '../db-connection/connect';
import { DatabaseErrorHandler } from '../error-handlers.ts/database-error-handler';
import { DatabaseError } from '../types/error/database-error';
import { GeneralAppResponse } from '../types/response/general-app-response';
import DbTable from '../enums/db-table';
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

  protected createGeneralSelectQuery(entityFields: { [key: string]: any }): { query: string, params: any[] } {
    
    console.log('entityFields', entityFields);
    let dbFields: {[key: string]: any} = SchemaMapper.toDbSchema(this.tableName, entityFields);
    let query = `SELECT * FROM ${this.tableName}`;
    let params: any[] = [];
    let index: number = 1;

    if (Object.keys(dbFields).length === 0) {
      query += ';';
      return { query, params };
    }

    query += ' WHERE';

    for (let key in dbFields) {
      if(dbFields[key] === null) {
        query += ` ${key} IS NULL`;
        continue;
      }
      if (typeof dbFields[key] === 'string' && dbFields[key].includes('%')) {
        query += ` ${key} ILIKE $${index}`;
      }
      else {
        query += ` ${key} = $${index}`;
      }
      if (index < Object.keys(dbFields).length) {
        query += ` AND`;
      } else {
        query += `;`;
      }

      params.push(dbFields[key]);
      index++;
    }

    console.log('query', query);
    console.log('params', params);
    return { query, params };
  }

}