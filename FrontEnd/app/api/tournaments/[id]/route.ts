import { NextResponse } from 'next/server';
import { getData } from '@/lib/api-db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, updatedAt } = await getData();
    const tournaments = (data?.tournaments ?? []) as Array<{ id: string }>;
    const tournament = tournaments.find((t) => t.id === params.id);
    if (!tournament) {
      return NextResponse.json(null, { status: 404 });
    }
    const response = NextResponse.json(tournament);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (updatedAt) {
      response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
    }
    return response;
  } catch (err) {
    console.error('GET /api/tournaments/[id] error', err);
    return NextResponse.json(null, { status: 404 });
  }
}
