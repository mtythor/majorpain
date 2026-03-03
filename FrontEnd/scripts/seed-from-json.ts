/**
 * Seed major_pain_state from mock JSON files.
 * Run from FrontEnd: npm run seed
 * Loads .env.local or .env for DATABASE_URL.
 */

import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

import pg from 'pg';
import { readFileSync } from 'fs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// When run from FrontEnd dir, public/api is relative to cwd
const publicDir = join(process.cwd(), 'public', 'api');

function loadJson<T>(filename: string): T {
  const filePath = join(publicDir, filename);
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function seed() {
  const tournaments = loadJson<unknown[]>('tournaments.json');
  const players = loadJson<unknown[]>('players.json');
  const golfers = loadJson<Record<string, unknown[]>>('golfers.json');
  const results = loadJson<Record<string, unknown>>('results.json');

  const data = {
    tournaments,
    players,
    golfers,
    results,
    draftStates: {} as Record<string, unknown>,
  };

  const pool = new pg.Pool({ connectionString });
  await pool.query(
    `INSERT INTO major_pain_state (id, data, updated_at) VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(data)]
  );
  await pool.end();
  console.log('Seeded major_pain_state with', tournaments.length, 'tournaments,', players.length, 'players');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
