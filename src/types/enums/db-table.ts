import { Application } from "../zod/application-entity";

enum DbTable {
	USERS = "users",
	JOBS = "jobs",
	COMPANIES = "companies",
	INVITES = "invites",
	MATCH_REPORTS = "match_reports",
	MATCHES = "matches",
	USER_PROFILES = "user_profiles",
	USER_EXPERIENCES = "user_experiences",
	USER_EDUCATION = "user_education",
	APPLICATIONS = "applications",
	APPLICATIONS_LIFECYCLE = "applications_lifecycle",
	INTERVIEWS = "interviews",
	INTERVIEW_QUESTIONS = "interview_questions",
	FILE_PARSED = "file_parsed",
}

export default DbTable;
