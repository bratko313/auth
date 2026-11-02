import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10
});

export async function testDatabaseConnection(): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query('SELECT 1');
        console.log('PostgreSQL connection successful');
    } finally {
        client.release();
    }
}
