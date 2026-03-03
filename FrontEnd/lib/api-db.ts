/**
 * Database access helpers for Major Pain API routes.
 * Reads/writes the single-row major_pain_state table.
 */

import { pool } from './db';

export interface MajorPainData {
  tournaments?: unknown[];
  players?: unknown[];
  golfers?: Record<string, unknown[]>;
  results?: Record<string, unknown>;
  draftStates?: Record<string, unknown>;
}

export async function getData(): Promise<{ data: MajorPainData | null; updatedAt: Date | null }> {
  const res = await pool.query('SELECT data, updated_at FROM major_pain_state WHERE id = 1');
  if (!res.rows?.length) return { data: null, updatedAt: null };
  const row = res.rows[0];
  return { data: row.data as MajorPainData, updatedAt: row.updated_at };
}

export async function saveData(data: MajorPainData): Promise<Date> {
  await pool.query(
    `INSERT INTO major_pain_state (id, data, updated_at) VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(data)]
  );
  const res = await pool.query('SELECT updated_at FROM major_pain_state WHERE id = 1');
  return res.rows[0]?.updated_at ?? new Date();
}

export async function saveDataIfUnchanged(
  data: MajorPainData,
  expectedUpdatedAt: Date
): Promise<{ ok: boolean; updatedAt: Date } | null> {
  const res = await pool.query(
    `UPDATE major_pain_state SET data = $1::jsonb, updated_at = NOW()
     WHERE id = 1 AND date_trunc('millisecond', updated_at) = date_trunc('millisecond', $2::timestamptz)
     RETURNING updated_at`,
    [JSON.stringify(data), expectedUpdatedAt]
  );
  if (!res.rows?.length) return null;
  return { ok: true, updatedAt: res.rows[0].updated_at };
}
