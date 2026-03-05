/**
 * Test Slash Golf API (RapidAPI Live Golf Data) for Major Pain compatibility.
 *
 * Set RAPIDAPI_KEY in .env.local or .env or run: RAPIDAPI_KEY=your_key npx tsx scripts/test-slash-golf-api.ts
 *
 * Uses 3 API calls: schedules, tournaments, leaderboards
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (Next.js convention), then .env
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
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.json();
}

function summarize(obj: unknown, maxItems = 2): string {
  if (Array.isArray(obj)) {
    return `[${obj.length} items] ${JSON.stringify(obj.slice(0, maxItems), null, 2)}`;
  }
  if (obj && typeof obj === 'object') {
    const keys = Object.keys(obj);
    return `{${keys.join(', ')}}`;
  }
  return String(obj);
}

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY is required. Add it to .env or run with RAPIDAPI_KEY=xxx');
    process.exit(1);
  }

  console.log('=== Slash Golf API Test ===\n');

  // orgId=1 is PGA Tour per RapidAPI examples
  const orgId = '1';
  const year = '2026';

  // 1. Schedule - RapidAPI may use /schedule (singular) and require orgId
  const schedulePaths = ['/schedule', '/schedules'];
  let schedules: Record<string, unknown> = {};
  for (const p of schedulePaths) {
    try {
      console.log(`1. GET ${p}?orgId=${orgId}&year=${year}`);
      schedules = (await fetchApi(p, { orgId, year })) as Record<string, unknown>;
      console.log(`   Success. Response keys: ${Object.keys(schedules).join(', ')}`);
      break;
    } catch (e) {
      console.log(`   Failed: ${(e as Error).message.slice(0, 60)}...`);
    }
  }

  const schedule = (
    Array.isArray(schedules?.schedule) ? schedules.schedule : []
  ) as Array<{ tournId?: string; name?: string; tournName?: string; year?: number }>;
  console.log(`   Tournaments in schedule: ${schedule.length}`);

  // Find Players Championship or use first available
  const playersChamp = schedule.find(
    (t) =>
      t.name?.toLowerCase().includes('players') ||
      t.name?.toLowerCase().includes('championship') ||
      t.name?.toLowerCase().includes('tpc sawgrass')
  );
  const targetTourn = playersChamp || schedule[0];
  const tournId = targetTourn?.tournId;
  const tournName = targetTourn?.name;

  let effectiveTournId = tournId;
  let effectiveYear = year;
  if (!effectiveTournId) {
    console.log('   No tournId from schedule. Trying known IDs (014=Players 2024) for leaderboard/tournament test...');
    effectiveTournId = '014'; // Players Championship 2024 from RapidAPI example
    effectiveYear = '2024';
  } else {
    console.log(`   Using: ${tournName} (tournId=${tournId})\n`);
  }

  // 2. Tournaments - entry list (field)
  if (effectiveTournId) {
    console.log('\n2. GET /tournament (entry list/field)');
    for (const p of ['/tournament', '/tournaments']) {
      try {
            const tournaments = (await fetchApi(p, { orgId, tournId: effectiveTournId, year: effectiveYear })) as Record<
          string,
          unknown
        >;
        const players = Array.isArray(tournaments?.players) ? tournaments.players : [];
        console.log(`   ${p} Success. Players in field: ${players.length}`);
        if (players.length > 0) {
          console.log('   Sample player:', JSON.stringify(players[0], null, 2));
        } else {
          console.log('   (No players array – tournament metadata only; field may use /field or /entries)');
        }
        break;
      } catch (e) {
        console.log(`   ${p} Failed.`);
      }
    }
  }

  // 3. Leaderboards - results (use 2025/2024 if 2026 has no data yet)
  if (effectiveTournId) {
    console.log('\n3. GET /leaderboard (results)');
    let leaderboards: Record<string, unknown> = {};
    for (const y of [year, '2025', '2024']) {
      try {
        leaderboards = (await fetchApi('/leaderboard', { orgId, tournId: effectiveTournId, year: y })) as Record<
          string,
          unknown
        >;
        console.log(`   Success with year=${y}`);
        break;
      } catch (e) {
        console.log(`   year=${y} failed.`);
      }
    }
    const leaderboard = Array.isArray(leaderboards?.leaderboardRows)
      ? leaderboards.leaderboardRows
      : Array.isArray(leaderboards?.leaderboard)
        ? leaderboards.leaderboard
        : Array.isArray(leaderboards?.players)
          ? leaderboards.players
          : [];
    const rounds = leaderboards?.rounds;
    console.log(`   Leaderboard entries: ${leaderboard.length}`);
    if (rounds) console.log(`   Rounds info:`, summarize(rounds));
    if (leaderboard.length > 0) {
      console.log('   Sample leaderboard entry:', JSON.stringify(leaderboard[0], null, 2));
      console.log('   Entry keys:', Object.keys((leaderboard[0] as object) || {}));
    }
  }

  console.log('\n=== Done. API calls used: 3 ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
