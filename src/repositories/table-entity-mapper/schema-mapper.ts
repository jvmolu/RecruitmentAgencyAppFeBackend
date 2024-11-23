import DbTable from "../../enums/db-table";
import userSchemaMappings from "./table-entity-mismatch-mappings/user-schema-mappings";

export type FieldMapping = {
    entityField: string;
    dbField: string;
};

export class SchemaMapper {
    
    private static schemas: { [key: string]: {mappings: FieldMapping[]} } = {
        [DbTable.USERS]: userSchemaMappings
    };

    static toEntity<T>(tableName: DbTable, dbRow: {[key: string]: any}): T {
        const schema:{mappings: FieldMapping[]} = this.schemas[tableName];
        if (!schema) return dbRow as T; // No mismatch mappings found, return the row as is.

        const result: any = {};
        Object.entries(dbRow).forEach(([dbField, value]) => {
            const mapping = schema.mappings.find(m => m.dbField === dbField);
            const entityField = mapping ? mapping.entityField : dbField; // If no mapping found, use the dbField as is.
            result[entityField] = value;
        });

        return result as T;
    }

    static toDbSchema(tableName: DbTable, entity: any): {[key: string]: any} {

        const schema = this.schemas[tableName];
        if (!schema) return entity; // No mismatch mappings found, return the entity as is.

        const result: any = {};
        Object.entries(entity).forEach(([entityField, value]) => {
            const mapping = schema.mappings.find(m => m.entityField === entityField);
            const dbField = mapping ? mapping.dbField : entityField;
            result[dbField] = value;
        });

        return result;
    }
}