import DbTable from "./enums/db-table";

export const ENUM_FIELD_MAP: Record<DbTable, string[]> = {
	[DbTable.USERS]: ["role", "status"],
	[DbTable.COMPANIES]: ["status"],
	[DbTable.JOBS]: [
		"budgetCurrency",
		"budgetPer",
		"jobType",
		"contractType",
		"workModel",
		"status",
	],
	[DbTable.INVITES]: [],
	[DbTable.MATCH_REPORTS]: [],
	[DbTable.MATCHES]: [],
	[DbTable.USER_EXPERIENCES]: [],
	[DbTable.USER_EDUCATION]: [],
	[DbTable.USER_PROFILES]: ["currentYearlySalary", "workLocationPreference"],
	[DbTable.APPLICATIONS]: [
		"status",
		"expectedBudgetCurrency",
		"expectedBudgetPer",
		"stage",
	],
	[DbTable.APPLICATIONS_LIFECYCLE]: ["status"],
	[DbTable.QUESTIONS]: [],
	[DbTable.INTERVIEWS]: ["status"],
	[DbTable.INTERVIEW_QUESTIONS]: ["type"],
};

export const isEnumField = (tableName: DbTable, fieldName: string): boolean => {
	return ENUM_FIELD_MAP[tableName].includes(fieldName);
};
