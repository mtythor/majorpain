// Script to export dummy data from TypeScript to JSON files
// Run with: npx tsx FrontEnd/scripts/export-dummy-data-to-json.ts
// Or: npm run export-mock-data (if script is added to package.json)

import * as dummyData from '../lib/dummyData';
import { writeFileSync } from 'fs';
import { join } from 'path';

const MOCK_DATA_DIR = join(__dirname, '../../MockData');
const PUBLIC_API_DIR = join(__dirname, '../public/api');

// Ensure directories exist
import { mkdirSync, existsSync } from 'fs';

if (!existsSync(MOCK_DATA_DIR)) {
  mkdirSync(MOCK_DATA_DIR, { recursive: true });
  console.log(`Created directory: ${MOCK_DATA_DIR}`);
}

if (!existsSync(PUBLIC_API_DIR)) {
  mkdirSync(PUBLIC_API_DIR, { recursive: true });
  console.log(`Created directory: ${PUBLIC_API_DIR}`);
}

// Export tournaments
writeFileSync(
  join(MOCK_DATA_DIR, 'tournaments.json'),
  JSON.stringify(dummyData.dummyTournaments, null, 2)
);

// Export golfers
writeFileSync(
  join(MOCK_DATA_DIR, 'golfers.json'),
  JSON.stringify(dummyData.dummyGolfers, null, 2)
);

// Export results
writeFileSync(
  join(MOCK_DATA_DIR, 'results.json'),
  JSON.stringify(dummyData.dummyTournamentResults, null, 2)
);

// Export players
writeFileSync(
  join(MOCK_DATA_DIR, 'players.json'),
  JSON.stringify(dummyData.dummyPlayers, null, 2)
);

// Also copy to public/api for Next.js serving
writeFileSync(
  join(PUBLIC_API_DIR, 'tournaments.json'),
  JSON.stringify(dummyData.dummyTournaments, null, 2)
);
writeFileSync(
  join(PUBLIC_API_DIR, 'golfers.json'),
  JSON.stringify(dummyData.dummyGolfers, null, 2)
);
writeFileSync(
  join(PUBLIC_API_DIR, 'results.json'),
  JSON.stringify(dummyData.dummyTournamentResults, null, 2)
);
writeFileSync(
  join(PUBLIC_API_DIR, 'players.json'),
  JSON.stringify(dummyData.dummyPlayers, null, 2)
);

console.log('✅ Export complete!');
console.log(`   Files written to: ${MOCK_DATA_DIR}`);
console.log(`   Files written to: ${PUBLIC_API_DIR}`);
