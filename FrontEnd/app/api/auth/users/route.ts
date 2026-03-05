import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { pool } from '@/lib/db';

const PLAYER_NAMES: Record<number, string> = {
  1: 'MtyThor',
  2: 'Atticus',
  3: 'KristaKay',
  4: 'MrHattyhat',
};

function getPlayerName(playerId: number): string {
  return PLAYER_NAMES[playerId] ?? `Player ${playerId}`;
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const res = await pool.query(
      'SELECT player_id, username, is_admin, is_super_admin FROM major_pain_users ORDER BY player_id'
    );
    const users = res.rows.map((row) => ({
      playerId: row.player_id,
      username: row.username,
      playerName: getPlayerName(row.player_id),
      isAdmin: row.is_admin,
      isSuperAdmin: row.is_super_admin,
    }));
    return NextResponse.json(users);
  } catch (err) {
    console.error('GET /api/auth/users error', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
