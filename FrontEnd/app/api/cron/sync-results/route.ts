/**
 * POST /api/cron/sync-results
 * Syncs golfer results from RapidAPI for tournaments in playing/completed state.
 * Called by system cron on Digital Ocean droplet or GitHub Actions.
 *
 * Auth: x-major-pain-cron-secret or Authorization: Bearer <CRON_SECRET>
 * Query: ?dryRun=true to fetch and map without saving
 */

import { NextResponse } from 'next/server';
import { syncResultsFromLiveApi } from '@/lib/sync-results';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request): string {
  const header =
    request.headers.get('x-major-pain-cron-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return (header ?? '').trim();
}

export async function POST(request: Request) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret) {
    const provided = getSecretFromRequest(request);
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';

  try {
    const result = await syncResultsFromLiveApi({ dryRun });
    return NextResponse.json(result);
  } catch (err) {
    console.error('POST /api/cron/sync-results error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
