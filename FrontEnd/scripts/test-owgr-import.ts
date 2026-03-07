/**
 * Test OWGR (world ranking) lookup when importing tournament field.
 * Run: npm run test-owgr (from FrontEnd folder)
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { fetchTournamentField } from '../lib/live-golf-api';

async function main() {
  const golfers = await fetchTournamentField('1');
  console.log('\nOWGR test - Top 5 from THE PLAYERS field:');
  golfers.slice(0, 5).forEach((g, i) => console.log(`  ${i + 1}. ${g.name} — rank: ${g.rank}`));
  const with999 = golfers.filter((g) => g.rank === 999).length;
  console.log(`\nPlayers with rank 999 (unranked): ${with999} of ${golfers.length}`);
  if (with999 === golfers.length) {
    console.log('\n⚠️  All ranks are 999 — OWGR lookup may be failing. Check server console when you Import.');
  } else {
    console.log('\n✓ OWGR lookup is working.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
