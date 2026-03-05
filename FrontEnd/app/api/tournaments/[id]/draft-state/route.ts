import { NextResponse } from 'next/server';
import { getData, saveData, saveDataIfUnchanged } from '@/lib/api-db';
import { emitDraftUpdate } from '@/lib/draft-events';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request, body: unknown): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (header) return header.trim();
  const b = body as { writeSecret?: string };
  return (b?.writeSecret ?? '').trim();
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const tournamentId = params.id;

    const { data, updatedAt } = await getData();
    const tournaments = data?.tournaments ?? [];
    const golfers = data?.golfers ?? {};
    const results = data?.results ?? {};
    const draftStates = data?.draftStates ?? {};
    const players = data?.players ?? [];

    const newDraftStates = { ...draftStates, [tournamentId]: body };

    const newData = {
      tournaments,
      players,
      golfers,
      results,
      draftStates: newDraftStates,
    };

    const bodyObj = body as { updatedAt?: string; updated_at?: string };
    const expectedUpdatedAt = bodyObj.updatedAt ?? bodyObj.updated_at;
    let newUpdatedAt: Date;

    if (updatedAt && expectedUpdatedAt) {
      const result = await saveDataIfUnchanged(newData, new Date(expectedUpdatedAt));
      if (result) {
        newUpdatedAt = result.updatedAt;
      } else {
        const fresh = await getData();
        return NextResponse.json(
          { conflict: true, data: fresh.data, updatedAt: fresh.updatedAt?.toISOString() },
          { status: 409 }
        );
      }
    } else {
      newUpdatedAt = await saveData(newData);
    }

    emitDraftUpdate(tournamentId);

    const response = NextResponse.json({ ok: true, updatedAt: newUpdatedAt.toISOString() });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    console.error('POST /api/tournaments/[id]/draft-state error', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
