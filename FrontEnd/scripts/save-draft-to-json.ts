// Script to save completed draft data to results.json
// Run with: npx tsx FrontEnd/scripts/save-draft-to-json.ts <tournamentId>
// Or pass draft data via stdin: echo '{"tournamentId":"4",...}' | npx tsx FrontEnd/scripts/save-draft-to-json.ts

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { TeamDraft } from '../lib/types';

const MOCK_DATA_DIR = join(__dirname, '../../MockData');
const PUBLIC_API_DIR = join(__dirname, '../public/api');

interface DraftData {
  tournamentId: string;
  fatRandoStolenGolfers: string[];
  teamDrafts: TeamDraft[];
}

function saveDraftToJson(draftData: DraftData) {
  const resultsPath = join(MOCK_DATA_DIR, 'results.json');
  const publicResultsPath = join(PUBLIC_API_DIR, 'results.json');
  
  // Read existing results
  let allResults: Record<string, any> = {};
  
  if (existsSync(resultsPath)) {
    try {
      const existing = readFileSync(resultsPath, 'utf-8');
      allResults = JSON.parse(existing);
    } catch (e) {
      console.warn('Could not read existing results.json, creating new file');
    }
  }
  
  // Update or create tournament entry with draft data only
  allResults[draftData.tournamentId] = {
    tournamentId: draftData.tournamentId,
    fatRandoStolenGolfers: draftData.fatRandoStolenGolfers,
    teamDrafts: draftData.teamDrafts,
    // golferResults and teamScores will be added later via separate commands
    golferResults: [],
    teamScores: [],
  };
  
  // Write to both locations
  writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
  writeFileSync(publicResultsPath, JSON.stringify(allResults, null, 2));
  
  console.log(`✅ Draft data saved for tournament ${draftData.tournamentId}`);
  console.log(`   Files updated: ${resultsPath}`);
  console.log(`   Files updated: ${publicResultsPath}`);
  console.log(`   Note: golferResults and teamScores are empty and should be added manually`);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Try to read from stdin
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      try {
        const draftData: DraftData = JSON.parse(input);
        saveDraftToJson(draftData);
      } catch (e) {
        console.error('Error parsing input:', e);
        process.exit(1);
      }
    });
  } else {
    // Tournament ID provided, try to read from localStorage backup
    const tournamentId = args[0];
    console.log(`Looking for draft data for tournament ${tournamentId}...`);
    console.log('Note: This script expects draft data to be passed via stdin or as JSON argument.');
    console.log('If you completed a draft in the browser, check localStorage for the key:');
    console.log(`  completed-draft-${tournamentId}`);
    console.log('');
    console.log('To use this script, pass the draft data as JSON:');
    console.log('  echo \'{"tournamentId":"4","fatRandoStolenGolfers":[...],"teamDrafts":[...]}\' | npx tsx FrontEnd/scripts/save-draft-to-json.ts');
  }
}

export { saveDraftToJson };
