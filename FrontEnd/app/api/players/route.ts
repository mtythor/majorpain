import { NextResponse } from 'next/server';
import { getData } from '@/lib/api-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, updatedAt } = await getData();
    const players = data?.players ?? [];
    const response = NextResponse.json(players);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (updatedAt) {
      response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
    }
    return response;
  } catch (err) {
    console.error('GET /api/players error', err);
    return NextResponse.json([], { status: 200 });
  }
}
