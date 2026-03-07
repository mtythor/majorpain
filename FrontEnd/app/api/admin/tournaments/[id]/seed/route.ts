import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';
import { getSeedDataForTournament, type SeedMode } from '@/lib/seed-data';
import { mergeTournamentsWithSchedule } from '@/lib/tournamentSchedule';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return (header ?? '').trim();
}

/**
 * POST /api/admin/tournaments/[id]/seed
 * Seeds mock data for a single tournament.
 * Body: { mode?: 0|'golfers'|1|2|3|4|'full' }
 *   - 0|'golfers': golfers only (field for draft testing)
 *   - 1|2|3|4: partial results through that round (uses existing teamDrafts if present)
 *   - 'full': golfers (if missing) + full 4-round results (uses existing teamDrafts if present)
 * Merges into existing state without affecting other tournaments.
 * Requires MAJOR_PAIN_WRITE_SECRET when configured.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const secret = (process.env.MAJOR_PAIN_WRITE_SECRET || '').trim();
  if (secret) {
    const provided = getSecretFromRequest(request);
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const tournamentId = params.id;
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 });
  }

  let mode: SeedMode = 1;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.mode === 'golfers' || body.mode === 0) {
      mode = 'golfers';
    } else if (body.mode === 'full' || (typeof body.mode === 'number' && body.mode >= 1 && body.mode <= 4)) {
      mode = body.mode;
    }
  } catch {
    // use default
  }

  try {
    const { data: current } = await getData();
    const existingGolfers = (current?.golfers as Record<string, unknown[]>)?.[tournamentId] as import('@/lib/types').Golfer[] | undefined;
    const existingResult = current?.results?.[tournamentId] as { teamDrafts?: Array<{ playerId: string; activeGolfers: string[]; alternateGolfer?: string }>; fatRandoStolenGolfers?: string[] } | undefined;
    const { golfers, results } = getSeedDataForTournament(
      tournamentId,
      mode,
      existingGolfers,
      existingResult ? { teamDrafts: existingResult.teamDrafts, fatRandoStolenGolfers: existingResult.fatRandoStolenGolfers } : undefined
    );
    let tournaments = mergeTournamentsWithSchedule(current?.tournaments as Array<{ id: string; state?: string; fieldSource?: 'dummy' | 'live'; fieldMeta?: { source: 'dummy' | 'live'; count: number; at: string } }> | undefined);
    if (mode === 'golfers') {
      const idx = tournaments.findIndex((t) => t.id === tournamentId);
      if (idx >= 0) {
        tournaments = [...tournaments];
        tournaments[idx] = {
          ...tournaments[idx],
          fieldSource: 'dummy' as const,
          fieldMeta: { source: 'dummy', count: golfers.length, at: new Date().toISOString() },
        };
      }
    }
    const merged = {
      tournaments,
      players: current?.players ?? [],
      golfers: {
        ...(current?.golfers ?? {}),
        [tournamentId]: golfers,
      },
      results: {
        ...(current?.results ?? {}),
        ...(results != null ? { [tournamentId]: results } : {}),
      },
      draftStates: current?.draftStates ?? {},
    };
    await saveData(merged);
    const parts = [`${golfers.length} golfers`];
    if (results) {
      parts.push(mode === 'full' ? 'full results (4 rounds)' : typeof mode === 'number' ? `through round ${mode}` : '');
    } else if (mode === 'golfers') {
      parts.push('(field only, no scores)');
    }
    return NextResponse.json({
      ok: true,
      message: `Seeded tournament ${tournamentId}: ${parts.join(', ')}`,
    });
  } catch (err) {
    console.error('POST /api/admin/tournaments/[id]/seed error', err);
    return NextResponse.json({ error: 'Failed to seed tournament' }, { status: 500 });
  }
}
