/**
 * Database access for Major Pain API routes.
 * - Postgres when DATABASE_URL is set (prod, local with Docker)
 * - JSON file when DATABASE_URL is not set (zero-setup local dev)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MajorPainData {
  tournaments?: unknown[];
  players?: unknown[];
  golfers?: Record<string, unknown[]>;
  results?: Record<string, unknown>;
  draftStates?: Record<string, unknown>;
}

const DATA_PATH = process.env.MAJOR_PAIN_DATA_PATH || path.join(process.cwd(), '.data', 'state.json');

async function getDataFromFile(): Promise<{ data: MajorPainData | null; updatedAt: Date | null }> {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_PATH)) {
      return { data: null, updatedAt: null };
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const data = parsed.data ?? null;
    const updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : null;
    return { data, updatedAt };
  } catch {
    return { data: null, updatedAt: null };
  }
}

async function saveDataToFile(data: MajorPainData): Promise<Date> {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const updatedAt = new Date();
  const payload = { data, updatedAt: updatedAt.toISOString() };
  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  return updatedAt;
}

export async function getData(): Promise<{ data: MajorPainData | null; updatedAt: Date | null }> {
  if (process.env.DATABASE_URL) {
    const { pool } = await import('./db');
    const res = await pool.query('SELECT data, updated_at FROM major_pain_state WHERE id = 1');
    if (!res.rows?.length) return { data: null, updatedAt: null };
    const row = res.rows[0];
    return { data: row.data as MajorPainData, updatedAt: row.updated_at };
  }
  return getDataFromFile();
}

export async function saveData(data: MajorPainData): Promise<Date> {
  if (process.env.DATABASE_URL) {
    const { pool } = await import('./db');
    await pool.query(
      `INSERT INTO major_pain_state (id, data, updated_at) VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(data)]
    );
    const res = await pool.query('SELECT updated_at FROM major_pain_state WHERE id = 1');
    return res.rows[0]?.updated_at ?? new Date();
  }
  return saveDataToFile(data);
}

export async function saveDataIfUnchanged(
  data: MajorPainData,
  expectedUpdatedAt: Date
): Promise<{ ok: boolean; updatedAt: Date } | null> {
  if (process.env.DATABASE_URL) {
    const { pool } = await import('./db');
    const res = await pool.query(
      `UPDATE major_pain_state SET data = $1::jsonb, updated_at = NOW()
       WHERE id = 1 AND date_trunc('millisecond', updated_at) = date_trunc('millisecond', $2::timestamptz)
       RETURNING updated_at`,
      [JSON.stringify(data), expectedUpdatedAt]
    );
    if (!res.rows?.length) return null;
    return { ok: true, updatedAt: res.rows[0].updated_at };
  }
  const { data: current, updatedAt } = await getDataFromFile();
  if (!current || !updatedAt || Math.abs(updatedAt.getTime() - expectedUpdatedAt.getTime()) > 1000) {
    return null;
  }
  const newUpdatedAt = await saveDataToFile(data);
  return { ok: true, updatedAt: newUpdatedAt };
}
