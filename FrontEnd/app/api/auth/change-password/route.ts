import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, comparePassword, hashPassword } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    }

    // Validate new password (min length)
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, {
        status: 400,
      });
    }

    const res = await pool.query(
      'SELECT password_hash FROM major_pain_users WHERE player_id = $1',
      [user.playerId]
    );
    const row = res.rows[0];
    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ok = await comparePassword(currentPassword, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const hash = await hashPassword(newPassword);
    await pool.query(
      'UPDATE major_pain_users SET password_hash = $1, force_password_change = false, updated_at = NOW() WHERE player_id = $2',
      [hash, user.playerId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/auth/change-password error', err);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
