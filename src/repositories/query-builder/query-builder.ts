import QueryOperation from "../../types/enums/query-operation";
import { JoinClause } from "../../types/enums/join-type";
import { SortOrder } from "../../types/enums/sort-order";

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
    [QueryOperation.BETWEEN]: (key) => `${key} BETWEEN `,
    [QueryOperation.ARRAY_INTERSECTS]: (key) => `${key} && ARRAY[$]`
  };

  public static buildSelectQuery(
    tableName: string,
    conditions: QueryFields = {},
    baseTableAlias: string = 't0',
    selectFieldsAndAlias: { field: string, alias?: string }[] = [],
    joins: JoinClause[] = [],
    groupBy: string[] = [],
    limit: number = 0,
    offset: number = 0,
    orderBy: string = '',
    sortOrder: SortOrder = SortOrder.ASC
  ): { query: string; params: any[] } {

    let query = `SELECT `;
  
    // If selectFields are specified, use them; otherwise, select all from base table
    if (selectFieldsAndAlias.length > 0) {
      selectFieldsAndAlias.forEach((selectField, index) => {
        query += `${selectField.field}`;
        if (selectField.alias) {
          query += ` AS ${selectField.alias}`;
        }
        if (index < selectFieldsAndAlias.length - 1) {
          query += ', ';
        }
      });
    } else {
      query += `${baseTableAlias}.*`;
    }
  
    query += ` FROM ${tableName} ${baseTableAlias} `;
  
    // Add JOIN clauses
    joins.forEach((join, index) => {
      const alias = join.alias || `t${index + 1}`;
      query += `${join.joinType} ${join.tableName} ${alias} ON ${join.onCondition} `;
    });

    const params: any[] = [];

    if (Object.keys(conditions).length > 0) {
      query += ' WHERE';
      // return { conditionStrings, params };
      let paramIndex = 1;
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
    }

    // Group By
    if (groupBy.length > 0) {
      query += ` GROUP BY ${groupBy.join(', ')}`;
    }

    // ORDER_BY
    if (orderBy) {
      // If the orderBy field is not fully qualified, add the baseTableAlias
      orderBy = orderBy.includes('.') ? orderBy : `${baseTableAlias}.${orderBy}`;
      query += ` ORDER BY ${orderBy} ${sortOrder}`;
    }

    // Add LIMIT and OFFSET
    if (limit > 0) {
      query += ` LIMIT ${limit}`;
    }
    if (offset > 0) {
      query += ` OFFSET ${offset}`;
    }

    console.log('query', query + ';');
    console.log('params', params);
    return { query: query + ';', params };
  }

  public static buildInsertQuery(tableName: string, fields: { [key: string]: any }): { query: string; params: any[] } {

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

  public static buildBulkInsertQuery(tableName: string, fieldsArray: any[]): { query: string, params: any[] } {
    const keys = Object.keys(fieldsArray[0]);
    const columns = keys.join(", ");
    const values = fieldsArray.map((fields, index) => {
        const placeholders = keys.map((_, i) => `$${index * keys.length + i + 1}`).join(", ");
        return `(${placeholders})`;
    }).join(", ");
    const params = fieldsArray.flatMap(Object.values);

    const query = `INSERT INTO ${tableName} (${columns}) VALUES ${values} RETURNING *`;
    console.log('query', query);
    console.log('params', params);
    return { query, params };
  }

  public static buildUpdateQuery(tableName: string, fields: { [key: string]: any }, conditions: QueryFields): { query: string; params: any[] } {

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

    // Returning all fields
    query += ' RETURNING *;';

    console.log('query', query);
    console.log('params', params);
    return { query: query, params };
  }


  public static buildUpdateQueryViaValue(
    tableName: string,
    updates: Array<{
      searchFields: Record<string, {value: any, parser: string}>,
      updateFields: Record<string, {value: any, parser: string}>
    }>,
    returningFields: string[] = ['*']
  ): { query: string; params: any[] } {
    
    if (updates.length === 0) return { query: '', params: [] };
  
    const updateColumnNames = Object.keys(updates[0].updateFields);
    const searchColumnNames = Object.keys(updates[0].searchFields);
    let params: any[] = [];
    let paramIndex = 1;
  
    // Build VALUES section with type casting
    const values = updates.map(row => {
      const placeholders = [
        ...Object.entries(row.updateFields).map(([_, field]) => {
          params.push(field.value);
          return `$${paramIndex++}${field.parser ? '::' + field.parser : ''} `;
        }),
        ...Object.entries(row.searchFields).map(([_, field]) => {
          params.push(field.value);
          return `$${paramIndex++}${field.parser ? '::' + field.parser : ''} `;
        })
      ];
      return `(${placeholders.join(',')})`;
    });
  
    const query = `
      UPDATE ${tableName} AS t
      SET ${updateColumnNames.map(col => 
        `${col} = v.${col}`
      ).join(', ')}
      FROM (VALUES
        ${values.join(', ')}
      ) AS v(${[...updateColumnNames, ...searchColumnNames].join(', ')})
      WHERE ${searchColumnNames.map(col => 
        `t.${col} = v.${col}`
      ).join(' AND ')}
      RETURNING ${returningFields.join(',')};
    `;
  
    return { query, params };
  }

  public static buildDeleteQuery(tableName: string, conditions: QueryFields): { query: string; params: any[] } {
    
    if (Object.keys(conditions).length === 0) {
      console.log('No conditions to delete');
      return { query: '', params: [] };
    }

    let query = `DELETE FROM ${tableName}`;
    const params: any[] = [];
    let paramIndex = 1;

    if(Object.keys(conditions).length > 0) {

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

    }

    // Returning all fields
    query += ' RETURNING *;';

    console.log('query', query);
    console.log('params', params);
    return { query: query, params };
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
          queryPart: ` ${this.operationHandlers[operation](key)} $${startIndex} AND $${startIndex + 1}`,
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