/**
 * Seed major_pain_users with 4 players.
 * Uses MAJOR_PAIN_INITIAL_PASSWORD or default ChangeMe123.
 * Run after migrations/002_users.sql.
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';

const INITIAL_PASSWORD = process.env.MAJOR_PAIN_INITIAL_PASSWORD || 'ChangeMe123';

const USERS = [
  { player_id: 1, username: 'mtythor', is_super_admin: true, is_admin: true },
  { player_id: 2, username: 'atticus', is_super_admin: false, is_admin: false },
  { player_id: 3, username: 'kristakay', is_super_admin: false, is_admin: false },
  { player_id: 4, username: 'mrhattyhat', is_super_admin: false, is_admin: false },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  const hash = await bcrypt.hash(INITIAL_PASSWORD, 10);

  for (const u of USERS) {
    await pool.query(
      `INSERT INTO major_pain_users (player_id, username, password_hash, is_admin, is_super_admin, force_password_change)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (player_id) DO UPDATE SET
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         force_password_change = true,
         updated_at = NOW()`,
      [u.player_id, u.username, hash, u.is_admin, u.is_super_admin]
    );
    console.log(`Seeded user: ${u.username} (player_id ${u.player_id})`);
  }

  await pool.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
