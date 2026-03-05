import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, hashPassword } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const admin = await requireSuperAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { playerId } = await params;
  const pid = parseInt(playerId, 10);
  if (isNaN(pid) || pid < 1 || pid > 4) {
    return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (typeof body.is_admin === 'boolean') {
      updates.push(`is_admin = $${i++}`);
      values.push(body.is_admin);
    }

    if (typeof body.password === 'string' && body.password.length > 0) {
      const hash = await hashPassword(body.password);
      updates.push(`password_hash = $${i++}`);
      values.push(hash);
    }

    if (typeof body.forcePasswordChange === 'boolean') {
      updates.push(`force_password_change = $${i++}`);
      values.push(body.forcePasswordChange);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
    }

    // Prevent super-admin from revoking own admin
    if (admin.playerId === pid && body.is_admin === false) {
      return NextResponse.json({ error: 'Super-admin cannot revoke own admin' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(pid);
    const whereParam = values.length;

    await pool.query(
      `UPDATE major_pain_users SET ${updates.join(', ')} WHERE player_id = $${whereParam}`,
      values
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/auth/users/[playerId] error', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
