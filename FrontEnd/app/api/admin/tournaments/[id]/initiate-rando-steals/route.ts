import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';
import { emitDraftUpdate } from '@/lib/draft-events';
import { generateFatRandoSteals, createFatRandoStealEvents, calculateDraftOrderWithData } from '@/lib/draft-logic';
import { isRyderCup } from '@/lib/dummyData';
import { sendDraftTurnNotification } from '@/lib/notifications';
import type { Golfer, Player } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request, body: unknown): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (header) return header.trim();
  const b = body as { writeSecret?: string };
  return (b?.writeSecret ?? '').trim();
}

/**
 * POST /api/admin/tournaments/[id]/initiate-rando-steals
 * Generates Fat Rando steals and initializes draft state.
 * Requires field to be seeded or imported (≥20 golfers). Disabled for Ryder Cup.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: unknown;
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const secret = (process.env.MAJOR_PAIN_WRITE_SECRET || '').trim();
  if (secret) {
    const provided = getSecretFromRequest(request, body);
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const tournamentId = params.id;
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 });
  }

  if (isRyderCup(tournamentId)) {
    return NextResponse.json(
      { error: 'Fat Rando steals are not used for Ryder Cup / Presidents Cup' },
      { status: 400 }
    );
  }

  try {
    const { data } = await getData();
    const golfers = (data?.golfers?.[tournamentId] ?? []) as Golfer[];
    const players = (data?.players ?? []) as Player[];

    if (golfers.length < 20) {
      return NextResponse.json(
        { error: 'Field must have at least 20 golfers. Seed or import the field first.' },
        { status: 400 }
      );
    }

    const fatRandoStolenGolfers = generateFatRandoSteals(golfers);
    if (fatRandoStolenGolfers.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate steals (field too small or invalid)' },
        { status: 400 }
      );
    }

    const stealEvents = createFatRandoStealEvents(fatRandoStolenGolfers, golfers);
    const tournaments = data?.tournaments ?? [];
    const results = (data?.results ?? {}) as Record<string, { teamScores?: Array<{ playerId: string; totalPoints: number }> } | null | undefined>;
    const draftOrder = calculateDraftOrderWithData(players, tournamentId, tournaments, results);

    const draftState = {
      tournamentId,
      fatRandoStolenGolfers,
      currentPick: 0,
      currentPlayerIndex: 0,
      draftOrder,
      picks: [],
      playerPicks: {} as Record<string, { activeGolfers: string[]; alternateGolfer?: string }>,
      activityLog: stealEvents,
    };

    const draftStates = data?.draftStates ?? {};

    const newData = {
      tournaments,
      players,
      golfers: data?.golfers ?? {},
      results,
      draftStates: { ...draftStates, [tournamentId]: draftState },
    };

    await saveData(newData);
    emitDraftUpdate(tournamentId);

    const firstPlayerId = draftOrder[0];
    const tournament = tournaments.find((t: { id?: string }) => t.id === tournamentId) as { name?: string } | undefined;
    const tournamentName = tournament?.name;
    await sendDraftTurnNotification(tournamentId, 0, firstPlayerId, tournamentName);

    return NextResponse.json({
      ok: true,
      message: `Fat Rando stole ${fatRandoStolenGolfers.length} golfers. Draft state initialized.`,
    });
  } catch (err) {
    console.error('POST /api/admin/tournaments/[id]/initiate-rando-steals error', err);
    const msg = err instanceof Error ? err.message : 'Failed to initiate steals';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
