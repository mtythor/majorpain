import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return (header ?? '').trim();
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
  const secret = (process.env.MAJOR_PAIN_WRITE_SECRET || '').trim();
  if (secret) {
    const provided = getSecretFromRequest(request);
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { data } = await getData();
    const current = data ?? {};
    const merged = {
      tournaments: body.tournaments !== undefined ? body.tournaments : current.tournaments,
      players: body.players !== undefined ? body.players : current.players,
      golfers: body.golfers !== undefined ? body.golfers : current.golfers,
      results: body.results !== undefined ? body.results : current.results,
      draftStates: body.draftStates !== undefined ? body.draftStates : current.draftStates,
    };
    await saveData(merged);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/admin/state error', err);
    return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
  }
}
