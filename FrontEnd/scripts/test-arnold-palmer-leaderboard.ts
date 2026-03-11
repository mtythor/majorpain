/**
 * Pre-validation: Arnold Palmer Invitational 2026 leaderboard (results).
 * Run before building the sync feature to confirm RapidAPI connectivity and data structure.
 *
 * Run: npx tsx scripts/test-arnold-palmer-leaderboard.ts
 * Optional: SAVE_FIXTURE=1 npx tsx scripts/test-arnold-palmer-leaderboard.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY?.trim();
const BASE_URL = 'https://live-golf-data.p.rapidapi.com';
const SAVE_FIXTURE = process.env.SAVE_FIXTURE === '1' || process.env.SAVE_FIXTURE === 'true';

const headers = {
  'X-RapidAPI-Key': RAPIDAPI_KEY || '',
  'X-RapidAPI-Host': 'live-golf-data.p.rapidapi.com',
};

async function fetchApi(apiPath: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(apiPath, BASE_URL);
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

  console.log('=== Arnold Palmer Invitational 2026 - Leaderboard (Results) Validation ===\n');
  console.log('Validates RapidAPI connectivity and leaderboard data structure before building sync.\n');

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

  // 2. Fetch leaderboard
  console.log('2. GET /leaderboard - fetching results...');
  const leaderboards = (await fetchApi('/leaderboard', {
    orgId,
    tournId,
    year,
  })) as Record<string, unknown>;

  const leaderboard = Array.isArray(leaderboards?.leaderboardRows)
    ? leaderboards.leaderboardRows
    : Array.isArray(leaderboards?.leaderboard)
      ? leaderboards.leaderboard
      : Array.isArray(leaderboards?.players)
        ? leaderboards.players
        : [];

  console.log(`   Leaderboard entries: ${leaderboard.length}`);
  console.log(`   Top-level keys: ${Object.keys(leaderboards).join(', ')}`);

  if (leaderboard.length === 0) {
    console.log('\n   No leaderboard rows. Response sample:', JSON.stringify(leaderboards, null, 2).slice(0, 500));
    process.exit(1);
  }

  // 3. Log schema
  const sample = leaderboard[0] as Record<string, unknown>;
  const sampleKeys = Object.keys(sample);
  console.log('\n3. Schema (sample row keys):');
  console.log('   ', sampleKeys.join(', '));

  console.log('\n4. Sample rows:');
  console.log('   Top 3:');
  (leaderboard as Array<Record<string, unknown>>).slice(0, 3).forEach((row, i) => {
    const name = [row.firstName ?? row.first_name, row.lastName ?? row.last_name].filter(Boolean).join(' ');
    const pos = row.position ?? row.rank ?? row.pos ?? '?';
    const total = row.totalToPar ?? row.total ?? row.score ?? '?';
    const r1 = row.round1 ?? row.r1 ?? '?';
    const r2 = row.round2 ?? row.r2 ?? '?';
    const r3 = row.round3 ?? row.r3 ?? '?';
    const r4 = row.round4 ?? row.r4 ?? '?';
    const madeCut = row.madeCut ?? row.cut ?? row.status ?? '?';
    console.log(`   ${i + 1}. ${name} | pos=${pos} total=${total} | r1=${r1} r2=${r2} r3=${r3} r4=${r4} | madeCut/cut/status=${madeCut}`);
  });

  // Find a likely cut golfer (if we can infer from rounds or status)
  const withTwoRounds = (leaderboard as Array<Record<string, unknown>>).filter((r) => {
    const r3 = r.round3 ?? r.r3;
    const r4 = r.round4 ?? r.r4;
    return (r3 == null || r3 === '' || r3 === '--') && (r4 == null || r4 === '' || r4 === '--');
  });
  if (withTwoRounds.length > 0) {
    const cutSample = withTwoRounds[0];
    const name = [cutSample.firstName ?? cutSample.first_name, cutSample.lastName ?? cutSample.last_name]
      .filter(Boolean)
      .join(' ');
    console.log('   Sample cut golfer (2 rounds only):');
    console.log('   ', JSON.stringify(cutSample, null, 2).slice(0, 400) + '...');
  }

  // 5. Save fixture
  if (SAVE_FIXTURE) {
    const fixturesDir = path.join(process.cwd(), 'scripts', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    const fixturePath = path.join(fixturesDir, 'arnold-palmer-2026-leaderboard.json');
    fs.writeFileSync(fixturePath, JSON.stringify(leaderboards, null, 2), 'utf-8');
    console.log(`\n5. Fixture saved: ${fixturePath}`);
  }

  console.log('\n=== Validation OK ===');
  console.log('   RapidAPI connectivity: OK');
  console.log('   Leaderboard data: OK');
  console.log('   Ready for leaderboard-mapper development.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
