import DbTable from "../../types/enums/db-table";
import applicationLifecycleSchemaMapping from "./table-entity-mismatch-mappings/application-lifecycle-schema-mapping";
import applicationSchemaMapping from "./table-entity-mismatch-mappings/application-schema-mapping";
import companySchemaMapping from "./table-entity-mismatch-mappings/company-schema-mapping";
import invitesSchemaMapper from "./table-entity-mismatch-mappings/invites-schema-mapping";
import jobSchemaMapping from "./table-entity-mismatch-mappings/job-schema-mapping";
import matchReportSchemaMapping from "./table-entity-mismatch-mappings/match-report-schema-mapping";
import matchSchemaMapping from "./table-entity-mismatch-mappings/match-schema-mapping";
import userEducationSchemaMapping from "./table-entity-mismatch-mappings/user-education-schema-mapping";
import userExperienceSchemaMapping from "./table-entity-mismatch-mappings/user-experience-schema-mapping";
import userProfileSchemaMapping from "./table-entity-mismatch-mappings/user-profile-schema-mapping";
import userSchemaMappings from "./table-entity-mismatch-mappings/user-schema-mappings";
import interviewSchemaMapping from "./table-entity-mismatch-mappings/interview-schema-mapping";
import interviewQuestionSchemaMapping from "./table-entity-mismatch-mappings/interview-question-schema-mapping";
import fileParsedSchemaMapping from "./table-entity-mismatch-mappings/file-parsed-schema-mapping";

export type FieldMapping = {
	entityField: string;
	dbField: string;
};

export class SchemaMapper {
	private static schemas: Record<DbTable, { mappings: FieldMapping[] }> = {
		[DbTable.USERS]: userSchemaMappings,
		[DbTable.COMPANIES]: companySchemaMapping,
		[DbTable.JOBS]: jobSchemaMapping,
		[DbTable.INVITES]: invitesSchemaMapper,
		[DbTable.USER_PROFILES]: userProfileSchemaMapping,
		[DbTable.APPLICATIONS]: applicationSchemaMapping,
		[DbTable.MATCHES]: matchSchemaMapping,
		[DbTable.MATCH_REPORTS]: matchReportSchemaMapping,
		[DbTable.USER_EXPERIENCES]: userExperienceSchemaMapping,
		[DbTable.USER_EDUCATION]: userEducationSchemaMapping,
		[DbTable.APPLICATIONS_LIFECYCLE]: applicationLifecycleSchemaMapping,
		[DbTable.INTERVIEWS]: interviewSchemaMapping,
		[DbTable.INTERVIEW_QUESTIONS]: interviewQuestionSchemaMapping,
		[DbTable.FILE_PARSED]: fileParsedSchemaMapping,
	};

	static toEntity<T>(tableName: DbTable, dbRow: { [key: string]: any }): T {
		const schema: { mappings: FieldMapping[] } = this.schemas[tableName];
		if (!schema) return dbRow as T; // No mismatch mappings found, return the row as is.
		const result: any = {};
		Object.entries(dbRow).forEach(([dbField, value]) => {
			const mapping = schema.mappings.find((m) => m.dbField === dbField);
			const entityField = mapping ? mapping.entityField : dbField; // If no mapping found, use the dbField as is
			result[entityField] = value;
		});
		return result as T;
	}

	static toDbSchema(tableName: DbTable, entity: any): { [key: string]: any } {
		const schema = this.schemas[tableName];
		if (!schema) return entity; // No mismatch mappings found, return the entity as is.

		const result: any = {};
		Object.entries(entity).forEach(([entityField, value]) => {
			const mapping = schema.mappings.find(
				(m) => m.entityField === entityField
			);
			const dbField = mapping ? mapping.dbField : entityField;
			result[dbField] = value;
		});

		return result;
	}

	static toDbField(tableName: DbTable, entityField: string): string {
		const schema = this.schemas[tableName];
		if (!schema) return entityField; // No mismatch mappings found, return the entity field as is.
		const mapping = schema.mappings.find((m) => m.entityField === entityField);
		return mapping ? mapping.dbField : entityField;
	}
}
