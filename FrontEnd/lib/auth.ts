/**
 * Auth utilities: JWT, bcrypt, requireAuth.
 * Server-side only - do not import in client components.
 * JWT_SECRET is loaded lazily (inside functions) so env is available.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { pool } from './db';

const BCRYPT_ROUNDS = 10;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set and at least 16 characters');
  }
  return secret;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: {
  playerId: number;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export function verifyToken(token: string): {
  playerId: number;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
} | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      playerId: number;
      username: string;
      isAdmin: boolean;
      isSuperAdmin: boolean;
    };
    return decoded;
  } catch {
    return null;
  }
}

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

export interface AuthUser {
  playerId: number;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  forcePasswordChange?: boolean;
}

export async function requireAuth(req: NextRequest): Promise<AuthUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  if (!process.env.DATABASE_URL) return null;

  const res = await pool.query(
    'SELECT player_id, username, is_admin, is_super_admin, force_password_change FROM major_pain_users WHERE player_id = $1',
    [payload.playerId]
  );
  const row = res.rows[0];
  if (!row) return null;

  return {
    playerId: row.player_id,
    username: row.username,
    isAdmin: row.is_admin,
    isSuperAdmin: row.is_super_admin,
    forcePasswordChange: row.force_password_change,
  };
}

export async function requireSuperAdmin(req: NextRequest): Promise<AuthUser | null> {
  const user = await requireAuth(req);
  if (!user || !user.isSuperAdmin) return null;
  return user;
}
