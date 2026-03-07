import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';
import { mergeTournamentsWithSchedule } from '@/lib/tournamentSchedule';
import { fetchTournamentField, LIVE_API_TOURNAMENT_MAP } from '@/lib/live-golf-api';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return (header ?? '').trim();
}

/**
 * POST /api/admin/tournaments/[id]/import-field
 * Imports tournament field from live golf API and saves to state.
 * Requires RAPIDAPI_KEY and MAJOR_PAIN_WRITE_SECRET when configured.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const secret = (process.env.MAJOR_PAIN_WRITE_SECRET || '').trim();
  if (secret) {
    const provided = getSecretFromRequest(_request);
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const tournamentId = params.id;
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 });
  }

  const apiKey = (process.env.RAPIDAPI_KEY || '').trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RAPIDAPI_KEY is not configured. Add it to .env.local for live field import.' },
      { status: 400 }
    );
  }

  try {
    const golfers = await fetchTournamentField(tournamentId);

    const { data: current } = await getData();
    const tournaments = mergeTournamentsWithSchedule(
      current?.tournaments as Array<{ id: string; state?: string; fieldSource?: 'dummy' | 'live'; fieldMeta?: { source: 'dummy' | 'live'; count: number; at: string; liveApiTournId?: string; liveApiYear?: string } }> | undefined
    );
    const tournamentIdx = tournaments.findIndex((t) => t.id === tournamentId);
    const updatedTournaments = [...tournaments];
    const mapping = LIVE_API_TOURNAMENT_MAP[tournamentId];
    const fieldMeta = {
      source: 'live' as const,
      count: golfers.length,
      at: new Date().toISOString(),
      liveApiTournId: mapping?.tournId,
      liveApiYear: mapping?.year,
    };
    if (tournamentIdx >= 0) {
      updatedTournaments[tournamentIdx] = {
        ...updatedTournaments[tournamentIdx],
        fieldSource: 'live' as const,
        fieldMeta,
      };
    }

    // Clear draft state and steals for this tournament so re-import gives a fresh slate
    const draftStates = { ...(current?.draftStates ?? {}) };
    delete draftStates[tournamentId];

    const resultsMap = { ...(current?.results ?? {}) } as Record<string, { tournamentId?: string; fatRandoStolenGolfers?: string[]; teamDrafts?: unknown[]; golferResults?: unknown[]; teamScores?: unknown[] }>;
    const existingResult = resultsMap[tournamentId] ?? { tournamentId };
    resultsMap[tournamentId] = {
      ...existingResult,
      fatRandoStolenGolfers: [],
      teamDrafts: [],
    };

    const merged = {
      tournaments: updatedTournaments,
      players: current?.players ?? [],
      golfers: {
        ...(current?.golfers ?? {}),
        [tournamentId]: golfers,
      },
      results: resultsMap,
      draftStates,
    };

    await saveData(merged);

    return NextResponse.json({
      ok: true,
      message: `Imported ${golfers.length} golfers from live API`,
    });
  } catch (err) {
    console.error('POST /api/admin/tournaments/[id]/import-field error', err);
    const msg = err instanceof Error ? err.message : 'Failed to import field';
    return NextResponse.json({ error: msg }, { status: err instanceof Error && msg.includes('No live API mapping') ? 400 : 500 });
  }
}
