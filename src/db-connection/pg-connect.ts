import { Pool, types } from "pg";
//docker exec -it postgres-recruitment psql -U postgres -d RecruitmentAgencyApp
// Set the parser for JSON (OID 114) and JSONB (OID 3802)
types.setTypeParser(114, (value) => JSON.parse(value));
types.setTypeParser(3802, (value) => JSON.parse(value));

const pool = new Pool({
	user: "postgres",
	host: "localhost",
	database: "RecruitmentAgencyApp",
	password: "root",
	port: 5432,
	max: 20, // Maximum number of clients in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
});

pool.on("error", (err) => {
	console.error("Unexpected error on idle client", err);
});

pool.on("connect", () => {
	console.log("Connected to the database");
});

export default pool;
