import { NextResponse } from 'next/server';
import { getData } from '@/lib/api-db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, updatedAt } = await getData();
    const golfers = data?.golfers?.[params.id] ?? [];
    const response = NextResponse.json(golfers);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (updatedAt) {
      response.headers.set('X-Major-Pain-Updated-At', updatedAt.toISOString());
    }
    return response;
  } catch (err) {
    console.error('GET /api/tournaments/[id]/golfers error', err);
    return NextResponse.json([], { status: 200 });
  }
}
