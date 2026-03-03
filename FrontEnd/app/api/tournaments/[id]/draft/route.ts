import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';
import { calculateTeamScoresFromDrafts } from '@/lib/dummyData';
import type { TournamentResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request, body: unknown): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (header) return header.trim();
  const b = body as { writeSecret?: string };
  return (b?.writeSecret ?? '').trim();
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, updatedAt } = await getData();
    const tournamentId = params.id;

    // Check for completed draft in results FIRST - completed takes precedence over stale in-progress state
    const results = data?.results?.[tournamentId] as { teamDrafts?: Array<{ activeGolfers?: unknown[]; alternateGolfer?: string }>; fatRandoStolenGolfers?: string[] } | undefined;
    const hasCompleteTeamDrafts = results?.teamDrafts && results.teamDrafts.length > 0 &&
      results.teamDrafts.every((d: { activeGolfers?: unknown[]; alternateGolfer?: string }) =>
        Array.isArray(d.activeGolfers) && d.activeGolfers.length === 3 && d.alternateGolfer);

    if (hasCompleteTeamDrafts) {
      const payload = {
        teamDrafts: results.teamDrafts,
        fatRandoStolenGolfers: results.fatRandoStolenGolfers ?? [],
        updatedAt: updatedAt?.toISOString(),
      };
      const response = NextResponse.json(payload);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      if (updatedAt) {
        response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
      }
      return response;
    }

    // Check for in-progress draft state (only when no completed draft in results)
    const draftState = data?.draftStates?.[tournamentId];
    if (draftState) {
      const response = NextResponse.json({
        ...(draftState as object),
        updatedAt: updatedAt?.toISOString(),
      });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      if (updatedAt) {
        response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
      }
      return response;
    }

    const response = NextResponse.json(null);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (updatedAt) {
      response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
    }
    return response;
  } catch (err) {
    console.error('GET /api/tournaments/[id]/draft error', err);
    return NextResponse.json(null, { status: 200 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: { teamDrafts?: unknown; fatRandoStolenGolfers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const secret = (process.env.MAJOR_PAIN_WRITE_SECRET || '').trim();
  if (secret) {
    const provided = getSecretFromRequest(request, body);
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { teamDrafts, fatRandoStolenGolfers } = body;
    if (!Array.isArray(teamDrafts) || !Array.isArray(fatRandoStolenGolfers)) {
      return NextResponse.json({ error: 'teamDrafts and fatRandoStolenGolfers required' }, { status: 400 });
    }

    const { data, updatedAt } = await getData();
    const tournaments = data?.tournaments ?? [];
    const golfers = data?.golfers ?? {};
    const results = data?.results ?? {};
    const draftStates = data?.draftStates ?? {};
    const players = data?.players ?? [];

    const tournamentId = params.id;
    const existing = results[tournamentId] as TournamentResult | undefined;
    const golferResults = existing?.golferResults ?? [];
    const teamScores = golferResults.length > 0
      ? calculateTeamScoresFromDrafts(teamDrafts, golferResults)
      : [];
    const newResults = {
      ...results,
      [tournamentId]: {
        tournamentId,
        teamDrafts,
        fatRandoStolenGolfers,
        golferResults,
        teamScores,
      },
    };
    const newDraftStates = { ...draftStates };
    delete newDraftStates[tournamentId];

    const newData = {
      tournaments,
      players,
      golfers,
      results: newResults,
      draftStates: newDraftStates,
    };

    const newUpdatedAt = await saveData(newData);
    const response = NextResponse.json({ ok: true, updatedAt: newUpdatedAt.toISOString() });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    console.error('POST /api/tournaments/[id]/draft error', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
