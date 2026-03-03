import { NextResponse } from 'next/server';
import { getData } from '@/lib/api-db';
import { mergeTournamentsWithSchedule } from '@/lib/tournamentSchedule';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, updatedAt } = await getData();
    const stored = (data?.tournaments ?? []) as Array<{ id: string; state?: string }>;
    const tournaments = mergeTournamentsWithSchedule(stored);
    const response = NextResponse.json(tournaments);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (updatedAt) {
      response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
    }
    return response;
  } catch (err) {
    console.error('GET /api/tournaments error', err);
    return NextResponse.json([], { status: 200 });
  }
}
