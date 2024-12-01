import DbTable from "./enums/db-table";

export const ENUM_FIELD_MAP: Record<DbTable, string[]> = {
    [DbTable.USERS]: ['role', 'status'],
    [DbTable.COMPANIES]: ['status'],
    [DbTable.JOBS]: ['budgetCurrency', 'budgetPer', 'jobType', 'contractType', 'workModel', 'status'],
    [DbTable.INVITES]: [],
    [DbTable.MATCH_REPORTS]: [],
    [DbTable.MATCHES]: [],
}

export const isEnumField = (tableName: DbTable, fieldName: string): boolean => {
    return ENUM_FIELD_MAP[tableName].includes(fieldName);
}
