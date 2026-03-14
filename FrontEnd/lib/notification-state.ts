/**
 * Notification state (sent keys) for deduplication.
 * Postgres when DATABASE_URL is set; JSON file when not.
 */

import * as fs from 'fs';
import * as path from 'path';

const STATE_PATH = process.env.MAJOR_PAIN_DATA_PATH
  ? path.join(path.dirname(process.env.MAJOR_PAIN_DATA_PATH), 'notification_state.json')
  : path.join(process.cwd(), '.data', 'notification_state.json');

export type SentMap = Record<string, boolean>;

async function getStateFromFile(): Promise<SentMap> {
  try {
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) return {};
    if (!fs.existsSync(STATE_PATH)) return {};
    const raw = fs.readFileSync(STATE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return (parsed.sent as SentMap) ?? {};
  } catch {
    return {};
  }
}

async function saveStateToFile(sent: SentMap): Promise<void> {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify({ sent, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
}

export async function getNotificationState(): Promise<SentMap> {
  if (process.env.DATABASE_URL) {
    const { pool } = await import('./db');
    const res = await pool.query('SELECT sent FROM major_pain_notification_state WHERE id = 1').catch((e) => { console.error('getNotificationState DB error (table may not exist — run migrations):', e.message); throw e; });
    if (!res.rows?.length) return {};
    const sent = res.rows[0].sent;
    return (sent as SentMap) ?? {};
  }
  return getStateFromFile();
}

export async function saveNotificationState(sent: SentMap): Promise<void> {
  if (process.env.DATABASE_URL) {
    const { pool } = await import('./db');
    await pool.query(
      `INSERT INTO major_pain_notification_state (id, sent, updated_at) VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET sent = EXCLUDED.sent, updated_at = NOW()`,
      [JSON.stringify(sent)]
    );
  } else {
    await saveStateToFile(sent);
  }
}
