import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';
import { isResultsComplete } from '@/lib/tournament-utils';
import type { TournamentResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request, body: unknown): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (header) return header.trim();
  const b = body as { writeSecret?: string };
  return (b?.writeSecret ?? '').trim();
}

export async function GET() {
  try {
    const { data, updatedAt } = await getData();
    const response = NextResponse.json(data ?? {});
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (updatedAt) {
      response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
    }
    return response;
  } catch (err) {
    console.error('GET /api/admin/state error', err);
    return NextResponse.json({ error: 'Failed to load state' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: unknown;
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
    const { data } = await getData();
    const current = data ?? {};
    let tournaments = body.tournaments !== undefined ? body.tournaments : current.tournaments;
    const results = body.results !== undefined ? body.results : current.results;

    // Event-triggered state: when results are saved and all rounds complete → completed
    if (body.results !== undefined && Array.isArray(tournaments) && results && typeof results === 'object') {
      tournaments = tournaments.map((t: { id: string; state?: string }) => {
        const res = (results as Record<string, TournamentResult>)[t.id];
        if (res && isResultsComplete(res)) {
          return { ...t, state: 'completed' as const };
        }
        return t;
      });
    }

    const merged = {
      tournaments,
      players: body.players !== undefined ? body.players : current.players,
      golfers: body.golfers !== undefined ? body.golfers : current.golfers,
      results,
      draftStates: body.draftStates !== undefined ? body.draftStates : current.draftStates,
    };
    await saveData(merged);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/admin/state error', err);
    return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
  }
}
