import QueryOperation from "../../types/enums/query-operation";

// src/types/query/query-condition.ts
export interface QueryCondition {
    value: any;
    operation: QueryOperation;
}
  
export type QueryFields = {
  [key: string]: QueryCondition;
};

// src/utils/query-builder.ts
export class QueryBuilder {

  private static operationHandlers: { [key in QueryOperation]: (key: string) => string } = {
    [QueryOperation.EQUALS]: (key) => `${key} = $`,
    [QueryOperation.NOT_EQUALS]: (key) => `${key} != $`,
    [QueryOperation.GREATER_THAN]: (key) => `${key} > $`,
    [QueryOperation.LESS_THAN]: (key) => `${key} < $`,
    [QueryOperation.GREATER_THAN_EQUALS]: (key) => `${key} >= $`,
    [QueryOperation.LESS_THAN_EQUALS]: (key) => `${key} <= $`,
    [QueryOperation.LIKE]: (key) => `${key} LIKE $`,
    [QueryOperation.ILIKE]: (key) => `${key} ILIKE $`,
    [QueryOperation.IN]: (key) => `${key} IN ($)`,
    [QueryOperation.NOT_IN]: (key) => `${key} NOT IN ($)`,
    [QueryOperation.IS_NULL]: (key) => `${key} IS NULL`,
    [QueryOperation.IS_NOT_NULL]: (key) => `${key} IS NOT NULL`,
    [QueryOperation.BETWEEN]: (key) => `${key} BETWEEN $ AND $`,
    [QueryOperation.ARRAY_INTERSECTS]: (key) => `${key} && ARRAY[$]`
  };

  static buildSelectQuery(tableName: string, conditions: QueryFields): { query: string; params: any[] } {

    console.log('conditions', conditions);
    let query = `SELECT * FROM ${tableName}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (Object.keys(conditions).length === 0) {
      console.log('query', query + ';');
      console.log('params', params);
      return { query: query + ';', params };
    }

    query += ' WHERE';
    
    Object.entries(conditions).forEach(([key, condition], index) => {
      const { value, operation } = condition;
      const { queryPart, newParams, incrementIndex } = this.handleOperation(key, value, operation, paramIndex);
      
      query += queryPart;
      params.push(...newParams);
      paramIndex += incrementIndex;

      if (index < Object.keys(conditions).length - 1) {
        query += ' AND';
      }
    });

    console.log('query', query + ';');
    console.log('params', params);
    return { query: query + ';', params };
  }

  static buildInsertQuery(tableName: string, fields: { [key: string]: any }): { query: string; params: any[] } {

    console.log('fields', fields);

    let query = `INSERT INTO ${tableName} (`;
    let params: any[] = [];
    let index = 1;

    for (let key in fields) {
      query += key;
      if (index < Object.keys(fields).length) {
        query += ', ';
      } else {
        query += ') VALUES (';
      }
      params.push(fields[key]);
      index++;
    }

    for (let i = 1; i <= Object.keys(fields).length; i++) {
      query += `$${i}`;
      if (i < Object.keys(fields).length) {
        query += ', ';
      } else {
        query += ') RETURNING *;';
      }
    }

    console.log('query', query);
    console.log('params', params);
    return { query, params };
  }

  static buildUpdateQuery(tableName: string, fields: { [key: string]: any }, conditions: QueryFields): { query: string; params: any[] } {

    if (Object.keys(fields).length === 0) {
      console.log('No fields to update');
      return { query: '', params: [] };
    }

    console.log('fields', fields);
    console.log('conditions', conditions);

    let query = `UPDATE ${tableName} SET`;
    const params: any[] = [];
    let paramIndex = 1;

    for (let key in fields) {
      query += ` ${key} = $${paramIndex}`;
      params.push(fields[key]);
      paramIndex++;

      if (paramIndex <= Object.keys(fields).length) {
        query += ',';
      }
    }

    query += ' WHERE';

    Object.entries(conditions).forEach(([key, condition], index) => {
      const { value, operation } = condition;
      const { queryPart, newParams, incrementIndex } = this.handleOperation(key, value, operation, paramIndex);
      
      query += queryPart;
      params.push(...newParams);
      paramIndex += incrementIndex;

      if (index < Object.keys(conditions).length - 1) {
        query += ' AND';
      }
    });

    console.log('query', query + ';');
    console.log('params', params);
    return { query: query + ';', params };
  }

  private static handleOperation(key: string, value: any, operation: QueryOperation, startIndex: number): 
    { queryPart: string; newParams: any[]; incrementIndex: number } {

    switch (operation) {
      case QueryOperation.IS_NULL:
      case QueryOperation.IS_NOT_NULL:
        return {
          queryPart: ` ${this.operationHandlers[operation](key)}`,
          newParams: [],
          incrementIndex: 0
        };

      case QueryOperation.BETWEEN:
        return {
          queryPart: ` ${this.operationHandlers[operation](key)}${startIndex} AND $${startIndex + 1}`,
          newParams: [value[0], value[1]],
          incrementIndex: 2
        };

      case QueryOperation.IN:
      case QueryOperation.NOT_IN:
        const placeholders = value.map((_: any, i: number) => `$${startIndex + i}`).join(', ');
        return {
          queryPart: ` ${this.operationHandlers[operation](key).replace('$', placeholders)}`,
          newParams: value,
          incrementIndex: value.length
        };

      case QueryOperation.ARRAY_INTERSECTS:
        const placeholdersArray = value.map((_: any, i: number) => `$${startIndex + i}`).join(', ');
        return {
          queryPart: ` ${this.operationHandlers[operation](key).replace('$', placeholdersArray)}`,
          newParams: value,
          incrementIndex: value.length
        };

      default:
        return {
          queryPart: ` ${this.operationHandlers[operation](key)}${startIndex}`,
          newParams: [value],
          incrementIndex: 1
        };
    }
  }
}

// JUST A TEST FUNCTION TO CHECK ABOVE FUNCTIONALITIES
async function main() {

  // Test Query Builder for ArrAy Intersects
  const jobFields = {
    id: 1,
    title: 'Software Engineer',
    skills: ['React', 'NodeJS'],
    job_description: null,
  };

  const queryConditions: QueryFields = {};
  Object.entries(jobFields).forEach(([key, value]) => {
    let operation: QueryOperation;
    if (value === null) {
      operation = QueryOperation.IS_NULL;
    } else if (typeof value === 'string' && key !== 'id') {
      operation = QueryOperation.ILIKE;
    } else if (Array.isArray(value)) {
      operation = QueryOperation.ARRAY_INTERSECTS;
    } else {
      operation = QueryOperation.EQUALS;
    }
    queryConditions[key] = { value, operation };
  });

  const { query, params } = QueryBuilder.buildSelectQuery('jobs', queryConditions);
  console.log('query', query);
  console.log('params', params);
}

// main();