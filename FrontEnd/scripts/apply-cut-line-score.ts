/**
 * Script to apply score-based cut line to existing tournament results
 * For The Players Championship: golfers at +4 or better make the cut
 * 
 * Run with: npx tsx FrontEnd/scripts/apply-cut-line-score.ts
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

function applyCutLineScore(tournamentId: string, cutLineScore: number, results: TournamentResult): TournamentResult {
  console.log(`\nApplying cut line score of +${cutLineScore} to tournament ${tournamentId}...`);
  
  // Calculate 2-round totalToPar for each golfer
  const golferTwoRoundScores = results.golferResults.map(result => {
    const round1 = result.rounds[0];
    const round2 = result.rounds[1];
    const twoRoundToPar = (round1?.toPar || 0) + (round2?.toPar || 0);
    
    return {
      golferId: result.golferId,
      twoRoundToPar,
      originalMadeCut: result.madeCut,
    };
  });
  
  // Determine who makes the cut based on 2-round score
  // cutLineScore of +4 means golfers at +4 or better (<= +4) make the cut
  const newCutMadeCut = new Set<string>();
  golferTwoRoundScores.forEach(({ golferId, twoRoundToPar }) => {
    if (twoRoundToPar <= cutLineScore) {
      newCutMadeCut.add(golferId);
    }
  });
  
  const madeCutCount = newCutMadeCut.size;
  const missedCutCount = results.golferResults.length - madeCutCount;
  
  console.log(`  - Made cut: ${madeCutCount} golfers`);
  console.log(`  - Missed cut: ${missedCutCount} golfers`);
  
  // Update golfer results
  const updatedGolferResults = results.golferResults.map(result => {
    const madeCut = newCutMadeCut.has(result.golferId);
    
    // If golfer now misses cut, update their data
    if (!madeCut) {
      return {
        ...result,
        madeCut: false,
        finalPosition: null,
        basePoints: 0,
        bonusPoints: 0,
        totalPoints: 0,
        // Keep only rounds 1-2, remove rounds 3-4
        rounds: result.rounds.slice(0, 2),
        // Recalculate totalScore and totalToPar for 2 rounds only
        totalScore: result.rounds[0].score + result.rounds[1].score,
        totalToPar: result.rounds[0].toPar + result.rounds[1].toPar,
      };
    }
    
    // If golfer made cut, ensure they have 4 rounds
    if (madeCut && result.rounds.length < 4) {
      // This shouldn't happen, but handle it just in case
      console.warn(`  ⚠️  Golfer ${result.golferId} made cut but has < 4 rounds`);
    }
    
    // If golfer now makes cut but previously didn't, we'd need to generate rounds 3-4
    // For now, just update the madeCut flag and keep existing rounds
    return {
      ...result,
      madeCut: true,
      // Keep existing rounds and scores
    };
  });
  
  // Recalculate positions for golfers who made cut (sort by totalToPar)
  const madeCutResults = updatedGolferResults
    .filter(r => r.madeCut)
    .sort((a, b) => a.totalToPar - b.totalToPar);
  
  // Assign positions with tie handling
  let position = 1;
  for (let i = 0; i < madeCutResults.length; i++) {
    if (i > 0 && madeCutResults[i].totalToPar !== madeCutResults[i - 1].totalToPar) {
      position = (madeCutResults[i - 1].finalPosition || 0) + 1;
    }
    madeCutResults[i].finalPosition = position;
  }
  
  // Update positions in the full results array
  const positionMap = new Map<string, number | null>();
  madeCutResults.forEach(r => positionMap.set(r.golferId, r.finalPosition));
  updatedGolferResults.forEach(r => {
    if (r.madeCut) {
      const newPosition = positionMap.get(r.golferId);
      if (newPosition !== undefined) {
        r.finalPosition = newPosition;
        // Recalculate points based on new position
        if (newPosition === null) {
          r.basePoints = 0;
          r.bonusPoints = 0;
          r.totalPoints = 0;
        } else {
          const basePoints = 100 - newPosition;
          let bonusPoints = 0;
          if (newPosition === 1) bonusPoints = 6;
          else if (newPosition >= 2 && newPosition <= 5) bonusPoints = 5;
          else if (newPosition >= 6 && newPosition <= 10) bonusPoints = 4;
          else if (newPosition >= 11 && newPosition <= 20) bonusPoints = 3;
          r.basePoints = basePoints;
          r.bonusPoints = bonusPoints;
          r.totalPoints = basePoints + bonusPoints;
        }
      }
    }
  });
  
  // Recalculate team scores based on updated golfer results
  const updatedTeamScores = results.teamDrafts.map(draft => {
    const golferPoints = draft.activeGolfers.map(golferId => {
      const result = updatedGolferResults.find(r => r.golferId === golferId);
      if (!result || !result.madeCut) {
        // Check if alternate made cut and can substitute
        const alternateResult = updatedGolferResults.find(r => r.golferId === draft.alternateGolfer);
        if (alternateResult && alternateResult.madeCut) {
          return {
            golferId: draft.alternateGolfer,
            points: alternateResult.totalPoints,
          };
        }
        return {
          golferId,
          points: 0,
        };
      }
      return {
        golferId,
        points: result.totalPoints,
      };
    });
    
    const totalPoints = golferPoints.reduce((sum, gp) => sum + gp.points, 0);
    
    return {
      playerId: draft.playerId,
      totalPoints,
      golferPoints,
    };
  });
  
  return {
    ...results,
    golferResults: updatedGolferResults,
    teamScores: updatedTeamScores,
  };
}

function processResults() {
  console.log('Reading results file...');
  const resultsData = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8')) as Record<string, TournamentResult | null>;
  
  // Apply +4 cut line to The Players Championship (tournament ID "1")
  if (resultsData['1']) {
    resultsData['1'] = applyCutLineScore('1', 4, resultsData['1']);
  } else {
    console.log('Tournament 1 (Players Championship) has no results.');
    return;
  }
  
  // Write updated results back to file
  console.log(`\nWriting updated results to ${RESULTS_FILE}...`);
  writeFileSync(RESULTS_FILE, JSON.stringify(resultsData, null, 2));
  
  // Also write to public/api directory
  console.log(`Writing updated results to ${PUBLIC_RESULTS_FILE}...`);
  writeFileSync(PUBLIC_RESULTS_FILE, JSON.stringify(resultsData, null, 2));
  
  console.log(`\n✅ Complete!`);
  console.log(`   The Players Championship now uses a +4 cut line.`);
}

// Run the script
try {
  processResults();
} catch (error) {
  console.error('Error processing results:', error);
  process.exit(1);
}
