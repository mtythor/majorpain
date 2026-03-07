/**
 * Debug OWGR lookup - run: cd FrontEnd && npx tsx scripts/test-owgr-debug.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const key = process.env.RAPIDAPI_KEY?.trim();
const headers = { 'X-RapidAPI-Key': key || '', 'X-RapidAPI-Host': 'live-golf-data.p.rapidapi.com' };

async function main() {
  if (!key) {
    console.error('RAPIDAPI_KEY missing in .env.local');
    process.exit(1);
  }

  // 1. Fetch stats (OWGR)
  console.log('1. Fetching OWGR stats...');
  const statsRes = await fetch('https://live-golf-data.p.rapidapi.com/stats?year=2026&statId=186', { headers });
  const statsData = await statsRes.json();
  const rankings = statsData?.rankings || statsData?.ranking || [];
  console.log('   Status:', statsRes.status, '| Rankings count:', rankings.length);

  const owgrMap = new Map<string, number>();
  for (const r of rankings) {
    const pid = r.playerId ?? r.player_id;
    if (pid != null && r.rank) owgrMap.set(String(pid).trim(), r.rank);
  }
  console.log('   OWGR map size:', owgrMap.size);
  console.log('   Sample OWGR keys:', [...owgrMap.keys()].slice(0, 5));

  // 2. Fetch tournament field
  console.log('\n2. Fetching tournament field...');
  const tournRes = await fetch('https://live-golf-data.p.rapidapi.com/tournament?orgId=1&tournId=011&year=2026', { headers });
  const tournData = await tournRes.json();
  const players = tournData?.players || [];
  console.log('   Players count:', players.length);
  console.log('   Sample tournament playerIds:', players.slice(0, 5).map((p: { playerId?: unknown }) => ({ val: p.playerId, type: typeof p.playerId })));

  // 3. Check overlap
  let matched = 0;
  const first5 = players.slice(0, 5);
  first5.forEach((p: { firstName?: string; lastName?: string; playerId?: unknown }) => {
    const id = String(p.playerId ?? '').trim();
    const rank = owgrMap.get(id);
    const found = rank != null;
    if (found) matched++;
    console.log('   ', p.firstName, p.lastName, '| id:', JSON.stringify(id), '| rank:', found ? rank : 'NOT FOUND');
  });
  console.log('\n   Matches in first 5:', matched);
  console.log('   Total matches:', players.filter((p: { playerId?: unknown }) => owgrMap.has(String(p.playerId ?? '').trim())).length, '/', players.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
