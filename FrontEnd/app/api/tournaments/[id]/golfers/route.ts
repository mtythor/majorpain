import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';
import { mergeTournamentsWithSchedule } from '@/lib/tournamentSchedule';
import { fetchTournamentField } from '@/lib/live-golf-api';
import type { Golfer } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, updatedAt } = await getData();
    let golfers: Golfer[] = (data?.golfers?.[params.id] ?? []) as Golfer[];

    if (golfers.length === 0) {
      const tournaments = mergeTournamentsWithSchedule(
        data?.tournaments as Array<{ id: string; state?: string; fieldSource?: 'dummy' | 'live' }> | undefined
      );
      const tournament = tournaments.find((t) => t.id === params.id);
      const useLive = tournament?.fieldSource === 'live' && (process.env.RAPIDAPI_KEY || '').trim().length > 0;

      if (useLive) {
        const liveGolfers = await fetchTournamentField(params.id);
        if (liveGolfers.length > 0) {
          golfers = liveGolfers;
          try {
            const merged = {
              tournaments: data?.tournaments ?? [],
              players: data?.players ?? [],
              golfers: {
                ...(data?.golfers ?? {}),
                [params.id]: liveGolfers,
              },
              results: data?.results ?? {},
              draftStates: data?.draftStates ?? {},
            };
            await saveData(merged);
          } catch (saveErr) {
            console.warn('[golfers] Failed to cache live field to state:', saveErr);
          }
        }
      }
    }

    const response = NextResponse.json(golfers);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (updatedAt) {
      response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
    }
    return response;
  } catch (err) {
    console.error('GET /api/tournaments/[id]/golfers error', err);
    return NextResponse.json([], { status: 200 });
  }
}
