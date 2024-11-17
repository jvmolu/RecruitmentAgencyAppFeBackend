import { Pool } from 'pg';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'RecruitmentAgencyApp',
    password: 'root',
    port: 5432,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000 // Close idle clients after 30 seconds
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('Connected to the database');
});

export default pool;