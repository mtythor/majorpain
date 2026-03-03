/**
 * PostgreSQL connection pool for Major Pain API.
 * Server-side only - do not import in client components.
 */

import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL not set - API routes will fail');
}

const pool = new pg.Pool({
  connectionString,
});

export { pool };
