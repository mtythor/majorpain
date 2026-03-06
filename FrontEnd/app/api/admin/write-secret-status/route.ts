import { NextResponse } from 'next/server';

/**
 * Diagnostic: returns whether the server requires the write secret.
 * Helps debug 401 Unauthorized when saving. Does not reveal the secret.
 */
export async function GET() {
  const required = !!(process.env.MAJOR_PAIN_WRITE_SECRET || '').trim();
  return NextResponse.json({ required });
}
