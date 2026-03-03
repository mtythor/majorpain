import { NextResponse } from 'next/server';
import { saveData } from '@/lib/api-db';
import { getSeedData } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

function getSecretFromRequest(request: Request): string {
  const header = request.headers.get('x-major-pain-write-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return (header ?? '').trim();
}

/**
 * POST /api/admin/seed
 * Replaces the entire database state with mock data for testing.
 * Requires MAJOR_PAIN_WRITE_SECRET when configured.
 */
export async function POST(request: Request) {
  const secret = (process.env.MAJOR_PAIN_WRITE_SECRET || '').trim();
  if (secret) {
    const provided = getSecretFromRequest(request);
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const seedData = getSeedData();
    await saveData(seedData);
    return NextResponse.json({
      ok: true,
      message: `Seeded ${seedData.tournaments?.length ?? 0} tournaments, ${seedData.players?.length ?? 0} players`,
    });
  } catch (err) {
    console.error('POST /api/admin/seed error', err);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
