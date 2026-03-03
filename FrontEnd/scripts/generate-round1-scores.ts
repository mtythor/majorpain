/**
 * Script to generate random Round 1 scores for US Open (tournament ID "4")
 * 
 * Run with: npx tsx FrontEnd/scripts/generate-round1-scores.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const RESULTS_FILE = join(__dirname, '../../MockData/results.json');
const PUBLIC_RESULTS_FILE = join(__dirname, '../public/api/results.json');
const GOLFERS_FILE = join(__dirname, '../public/api/golfers.json');

interface RoundScore {
  round: number;
  score: number;
  toPar: number;
}

interface GolferTournamentResult {
  golferId: string;
  finalPosition: number | null;
  rounds: RoundScore[];
  totalScore: number;
  totalToPar: number;
  madeCut: boolean;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

interface TournamentResult {
  tournamentId: string;
  fatRandoStolenGolfers: string[];
  teamDrafts: Array<{
    playerId: string;
    activeGolfers: string[];
    alternateGolfer: string;
  }>;
  golferResults: GolferTournamentResult[];
  teamScores: Array<{
    playerId: string;
    totalPoints: number;
    golferPoints: Array<{
      golferId: string;
      points: number;
    }>;
  }>;
}

interface Golfer {
  id: string;
  name: string;
  rank: number;
  odds: string;
}

// Generate random round 1 score based on golfer rank
// Better ranked golfers tend to score better
function generateRound1Score(golferRank: number, golferIndex: number): RoundScore {
  // Base score based on rank (US Open par is 70)
  let baseScore = 72;
  if (golferRank <= 5) baseScore = 68;
  else if (golferRank <= 10) baseScore = 69;
  else if (golferRank <= 20) baseScore = 70;
  else if (golferRank <= 30) baseScore = 71;
  else if (golferRank <= 50) baseScore = 72;
  else baseScore = 73;
  
  // Add random variance (-4 to +6 strokes)
  const variance = Math.floor(Math.random() * 11) - 4;
  const score = Math.max(65, Math.min(80, baseScore + variance));
  
  return {
    round: 1,
    score,
    toPar: score - 70, // US Open par is 70
  };
}

function processResults() {
  console.log('Reading golfers file...');
  const golfersData = JSON.parse(readFileSync(GOLFERS_FILE, 'utf-8')) as Record<string, Golfer[]>;
  const golfers = golfersData['4'] || [];
  
  if (golfers.length === 0) {
    console.error('No golfers found for tournament 4 (US Open)');
    return;
  }
  
  console.log(`Found ${golfers.length} golfers for US Open`);
  
  console.log('Reading results file...');
  const resultsData = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8')) as Record<string, TournamentResult | null>;
  
  // Get existing tournament result or create new one
  let tournamentResult = resultsData['4'];
  
  if (!tournamentResult) {
    console.log('No existing results found. Creating new tournament result structure...');
    // Check if draft data exists in localStorage or results file
    tournamentResult = {
      tournamentId: '4',
      fatRandoStolenGolfers: [],
      teamDrafts: [],
      golferResults: [],
      teamScores: [],
    };
  }
  
  // Generate round 1 scores for all golfers
  console.log('\nGenerating Round 1 scores...');
  const golferResults: GolferTournamentResult[] = golfers.map((golfer, index) => {
    const round1 = generateRound1Score(golfer.rank, index);
    
    return {
      golferId: golfer.id,
      finalPosition: null, // No final position yet (only round 1)
      rounds: [round1],
      totalScore: round1.score,
      totalToPar: round1.toPar,
      madeCut: false, // Can't determine cut after round 1
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
    };
  });
  
  // Update tournament result with round 1 scores
  tournamentResult.golferResults = golferResults;
  
  // Keep existing draft data if it exists
  // (teamDrafts and fatRandoStolenGolfers remain unchanged)
  
  // Update results data
  resultsData['4'] = tournamentResult;
  
  // Write updated results back to file
  console.log(`\nWriting updated results to ${RESULTS_FILE}...`);
  writeFileSync(RESULTS_FILE, JSON.stringify(resultsData, null, 2));
  
  // Also write to public/api directory
  console.log(`Writing updated results to ${PUBLIC_RESULTS_FILE}...`);
  writeFileSync(PUBLIC_RESULTS_FILE, JSON.stringify(resultsData, null, 2));
  
  console.log(`\n✅ Complete!`);
  console.log(`   US Open now has Round 1 scores for ${golferResults.length} golfers`);
  console.log(`   Scores range from ${Math.min(...golferResults.map(r => r.rounds[0].score))} to ${Math.max(...golferResults.map(r => r.rounds[0].score))}`);
}

// Run the script
try {
  processResults();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
