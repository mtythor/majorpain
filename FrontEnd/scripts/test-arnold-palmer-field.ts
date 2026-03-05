/**
 * Test: Arnold Palmer Invitational 2026 - can we get the field and world rankings?
 * Run: npx tsx scripts/test-arnold-palmer-field.ts
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY?.trim();
const BASE_URL = 'https://live-golf-data.p.rapidapi.com';

const headers = {
  'X-RapidAPI-Key': RAPIDAPI_KEY || '',
  'X-RapidAPI-Host': 'live-golf-data.p.rapidapi.com',
};

async function fetchApi(path: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY required in .env.local');
    process.exit(1);
  }

  const orgId = '1';
  const year = '2026';

  console.log('=== Arnold Palmer Invitational 2026 - Field + Rankings Test ===\n');

  // 1. Get schedule, find Arnold Palmer
  console.log('1. GET /schedule - finding Arnold Palmer Invitational...');
  const schedules = (await fetchApi('/schedule', { orgId, year })) as Record<string, unknown>;
  const schedule = (Array.isArray(schedules?.schedule) ? schedules.schedule : []) as Array<{
    tournId?: string;
    name?: string;
    tournName?: string;
  }>;

  const arnoldPalmer = schedule.find(
    (t) =>
      t.name?.toLowerCase().includes('arnold palmer') ||
      t.name?.toLowerCase().includes('bay hill') ||
      t.tournName?.toLowerCase().includes('arnold palmer')
  );

  if (!arnoldPalmer?.tournId) {
    console.log('   Schedule entries:', schedule.map((t) => ({ name: t.name, tournId: t.tournId })).slice(0, 15));
    console.log('   Could not find Arnold Palmer. Full schedule count:', schedule.length);
    process.exit(1);
  }

  const tournId = arnoldPalmer.tournId;
  console.log(`   Found: ${arnoldPalmer.name} (tournId=${tournId})\n`);

  // 2. Try to get field from various endpoints
  console.log('2. Fetching field (players)...');

  const fieldEndpoints = ['/tournament', '/tournaments', '/field', '/entries', '/players'];
  let players: Array<Record<string, unknown>> = [];

  for (const p of fieldEndpoints) {
    try {
      const data = (await fetchApi(p, { orgId, tournId, year })) as Record<string, unknown>;
      const arr =
        Array.isArray(data?.players) ? data.players
        : Array.isArray(data?.field) ? data.field
        : Array.isArray(data?.entries) ? data.entries
        : Array.isArray(data?.leaderboardRows) ? data.leaderboardRows
        : [];
      if (arr.length > 0) {
        players = arr as Array<Record<string, unknown>>;
        console.log(`   ${p} SUCCESS: ${players.length} players`);
        break;
      } else {
        console.log(`   ${p}: no player array (keys: ${Object.keys(data).join(', ')})`);
      }
    } catch (e) {
      console.log(`   ${p}: ${(e as Error).message.split('\n')[0].slice(0, 60)}`);
    }
  }

  // 3. Also try leaderboard (may have field before Round 1)
  if (players.length === 0) {
    console.log('\n   Trying /leaderboard (field sometimes listed pre-event)...');
    try {
      const lb = (await fetchApi('/leaderboard', { orgId, tournId, year })) as Record<string, unknown>;
      const rows = Array.isArray(lb?.leaderboardRows) ? lb.leaderboardRows : [];
      if (rows.length > 0) {
        players = rows as Array<Record<string, unknown>>;
        console.log(`   /leaderboard SUCCESS: ${players.length} entries`);
      } else {
        console.log(`   /leaderboard: no leaderboardRows`);
      }
    } catch (e) {
      console.log(`   /leaderboard: ${(e as Error).message.split('\n')[0].slice(0, 60)}`);
    }
  }

  // 4. Try World Ranking endpoints (RapidAPI lists OWGR - but endpoints may not be implemented)
  console.log('\n3. Fetching World Rankings (OWGR)...');
  const rankingPaths = ['/ranking', '/rankings', '/worldRanking', '/owgr', '/fedex'];
  let rankings: Array<Record<string, unknown>> = [];
  let rankingSource = '';

  for (const p of rankingPaths) {
    try {
      const data = (await fetchApi(p, { orgId, year })) as Record<string, unknown>;
      const arr =
        Array.isArray(data?.ranking) ? data.ranking
        : Array.isArray(data?.rankings) ? data.rankings
        : Array.isArray(data?.players) ? data.players
        : Array.isArray(data?.leaderboard) ? data.leaderboard
        : [];
      if (arr.length > 0) {
        rankings = arr as Array<Record<string, unknown>>;
        rankingSource = p;
        console.log(`   ${p} SUCCESS: ${rankings.length} ranked players`);
        break;
      }
    } catch (e) {
      const msg = (e as Error).message;
      console.log(`   ${p}: ${msg.includes('404') ? '404' : msg.slice(0, 50)}`);
    }
  }

  // 5. Output combined field + rank
  console.log('\n=== RESULTS ===\n');

  if (players.length > 0) {
    console.log(`Field: ${players.length} players`);
    // Check if player objects already have rank/OWGR
    const sampleKeys = Object.keys(players[0] || {});
    console.log('Player object keys:', sampleKeys.join(', '));
    if (sampleKeys.length > 0 && players[0]) {
      console.log('Sample player:', JSON.stringify(players[0], null, 2));
    }
    const getPlayerName = (p: Record<string, unknown>) => {
      const first = p.firstName ?? p.first_name ?? '';
      const last = p.lastName ?? p.last_name ?? p.name ?? '';
      return [first, last].filter(Boolean).join(' ');
    };
    const getPlayerId = (p: Record<string, unknown>) => String(p.playerId ?? p.id ?? p.golferId ?? '');

    const rankByPlayerId = new Map<string, number>();
    if (rankings.length > 0) {
      rankings.forEach((r, i) => {
        const id = String(r.playerId ?? r.id ?? r.golferId ?? '');
        const rank = (r.rank ?? r.position ?? i + 1) as number;
        if (id) rankByPlayerId.set(id, typeof rank === 'string' ? parseInt(rank, 10) : rank);
      });
    }

    console.log('\nSample (first 15 with rank if available):');
    players.slice(0, 15).forEach((p, i) => {
      const name = getPlayerName(p);
      const id = getPlayerId(p);
      const rank = rankByPlayerId.get(id) ?? (p.rank ?? p.position ?? '—');
      console.log(`   ${i + 1}. ${name} ${id ? `(id=${id})` : ''} — OWGR: ${rank}`);
    });

    if (players.length > 15) {
      console.log(`   ... and ${players.length - 15} more`);
    }
  } else {
    console.log('No field data retrieved.');
  }

  if (rankings.length > 0 && rankingSource) {
    console.log(`\nWorld rankings: ${rankings.length} from ${rankingSource}`);
    console.log('Sample:', JSON.stringify(rankings[0], null, 2));
  } else {
    console.log('\nNo world ranking data retrieved.');
  }

  console.log('\n=== Done ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
