/**
 * POST /api/admin/tournaments/[id]/sync-results
 * Syncs golfer results from RapidAPI for a single tournament.
 * Admin-only (uses MAJOR_PAIN_WRITE_SECRET).
 *
 * Query: ?dryRun=true to fetch and map without saving
 */

import { NextResponse } from 'next/server';
import { syncResultsFromLiveApi } from '@/lib/sync-results';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request): string {
  const header =
    request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return (header ?? '').trim();
}

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

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';

  const apiKey = (process.env.RAPIDAPI_KEY || '').trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RAPIDAPI_KEY is not configured. Add it to .env.local for live results sync.' },
      { status: 400 }
    );
  }

  try {
    const result = await syncResultsFromLiveApi({
      dryRun,
      tournamentId,
    });
    const message =
      result.errors.length > 0
        ? result.synced.length > 0
          ? `Synced ${result.synced.join(', ')}; errors: ${result.errors.join('; ')}`
          : result.errors.join('; ')
        : result.synced.length > 0
          ? dryRun
            ? `Dry run: would sync ${result.synced.join(', ')}`
            : `Results synced for ${result.synced.join(', ')}`
          : 'No tournaments matched (playing/completed, live field, team drafts required).';
    return NextResponse.json({ ...result, message });
  } catch (err) {
    console.error(`POST /api/admin/tournaments/${tournamentId}/sync-results error`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
