import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

const PLAYER_NAMES: Record<number, string> = {
  1: 'MtyThor',
  2: 'Atticus',
  3: 'KristaKay',
  4: 'MrHattyhat',
};

function getPlayerName(playerId: number): string {
  return PLAYER_NAMES[playerId] ?? `Player ${playerId}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Auth not configured (no database)' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const username = String(body.username ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const res = await pool.query(
      'SELECT player_id, username, password_hash, is_admin, is_super_admin, force_password_change FROM major_pain_users WHERE username = $1',
      [username]
    );
    const row = res.rows[0];
    if (!row) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const ok = await comparePassword(password, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = signToken({
      playerId: row.player_id,
      username: row.username,
      isAdmin: row.is_admin,
      isSuperAdmin: row.is_super_admin,
    });

    return NextResponse.json({
      token,
      playerId: row.player_id,
      playerName: getPlayerName(row.player_id),
      isAdmin: row.is_admin,
      isSuperAdmin: row.is_super_admin,
      forcePasswordChange: row.force_password_change ?? false,
    });
  } catch (err) {
    console.error('POST /api/auth/login error', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
