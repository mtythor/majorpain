/**
 * Script to sort golfers by total strokes (lowest to highest) and assign positions
 * Handles ties - golfers with the same totalScore get the same position
 * 
 * Run with: npx tsx FrontEnd/scripts/sort-golfers-by-strokes.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const RESULTS_FILE = join(__dirname, '../../MockData/results.json');
const PUBLIC_RESULTS_FILE = join(__dirname, '../public/api/results.json');

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

function assignPositions(golferResults: GolferTournamentResult[]): GolferTournamentResult[] {
  // Separate golfers who made cut from those who didn't
  const madeCut: GolferTournamentResult[] = [];
  const missedCut: GolferTournamentResult[] = [];
  
  golferResults.forEach(result => {
    if (result.madeCut && result.totalScore > 0) {
      madeCut.push(result);
    } else {
      missedCut.push(result);
    }
  });
  
  // Sort made-cut golfers by totalScore (ascending - lower is better)
  madeCut.sort((a, b) => a.totalScore - b.totalScore);
  
  // Assign positions with tie handling
  // Position starts at 1, and increments sequentially (ties share position, next position is +1)
  let position = 1;
  for (let i = 0; i < madeCut.length; i++) {
    // If this is not the first golfer
    if (i > 0) {
      // If score is different from previous, advance position
      if (madeCut[i].totalScore !== madeCut[i - 1].totalScore) {
        // Find the first golfer in the tied group (go backwards to find start of tie)
        let firstTiedIndex = i - 1;
        while (firstTiedIndex > 0 && madeCut[firstTiedIndex - 1].totalScore === madeCut[i - 1].totalScore) {
          firstTiedIndex--;
        }
        // Count how many golfers are in this tied group
        let tiedCount = 1;
        let j = firstTiedIndex;
        while (j < i && madeCut[j].totalScore === madeCut[i - 1].totalScore) {
          tiedCount++;
          j++;
        }
        // Advance position: position of first tied golfer + number of tied golfers
        // This ensures sequential positions: if 2 tie at 5, next is 7 (5+2)
        // But user wants: if 2 tie at 5, next is 6 (5+1)
        // So we just advance by 1 from the previous position
        position = (madeCut[i - 1].finalPosition || 0) + 1;
      }
      // If score is same as previous, use same position (tied)
      // position stays the same
    }
    
    // Assign position (ties get the same position)
    madeCut[i].finalPosition = position;
  }
  
  // Missed cut golfers get null position
  missedCut.forEach(result => {
    result.finalPosition = null;
  });
  
  // Combine back together (made cut first, then missed cut)
  return [...madeCut, ...missedCut];
}

function processResults() {
  console.log('Reading results file...');
  const resultsData = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8')) as Record<string, TournamentResult | null>;
  
  let tournamentsProcessed = 0;
  let golfersRepositioned = 0;
  
  Object.keys(resultsData).forEach(tournamentId => {
    const tournamentResult = resultsData[tournamentId];
    
    if (!tournamentResult) {
      console.log(`Tournament ${tournamentId}: No results (null)`);
      return;
    }
    
    console.log(`\nProcessing tournament ${tournamentId}...`);
    const beforeCount = tournamentResult.golferResults.length;
    
    // Sort and assign positions
    tournamentResult.golferResults = assignPositions(tournamentResult.golferResults);
    
    const afterCount = tournamentResult.golferResults.length;
    const madeCutCount = tournamentResult.golferResults.filter(r => r.finalPosition !== null).length;
    
    console.log(`  - Total golfers: ${afterCount}`);
    console.log(`  - Made cut: ${madeCutCount}`);
    console.log(`  - Missed cut: ${afterCount - madeCutCount}`);
    
    // Show top 10 positions
    const top10 = tournamentResult.golferResults
      .filter(r => r.finalPosition !== null)
      .sort((a, b) => (a.finalPosition || 999) - (b.finalPosition || 999))
      .slice(0, 10);
    
    console.log(`  - Top 10:`);
    top10.forEach(result => {
      console.log(`    Position ${result.finalPosition}: ${result.totalScore} strokes`);
    });
    
    tournamentsProcessed++;
    golfersRepositioned += afterCount;
  });
  
  // Write updated results back to file
  console.log(`\nWriting updated results to ${RESULTS_FILE}...`);
  writeFileSync(RESULTS_FILE, JSON.stringify(resultsData, null, 2));
  
  // Also write to public/api directory
  console.log(`Writing updated results to ${PUBLIC_RESULTS_FILE}...`);
  writeFileSync(PUBLIC_RESULTS_FILE, JSON.stringify(resultsData, null, 2));
  
  console.log(`\n✅ Complete!`);
  console.log(`   - Tournaments processed: ${tournamentsProcessed}`);
  console.log(`   - Total golfers repositioned: ${golfersRepositioned}`);
}

// Run the script
try {
  processResults();
} catch (error) {
  console.error('Error processing results:', error);
  process.exit(1);
}
