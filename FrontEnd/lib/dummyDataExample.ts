/**
 * Example usage of dummy data
 * 
 * This file shows how to use the dummy data in your components
 */

import { getTournamentData, getAllTournamentData, dummyTournaments, dummyPlayers } from './dummyData';

// Example 1: Get data for a specific tournament
export function getTournamentExample(tournamentId: string) {
  const { tournament, golfers, results } = getTournamentData(tournamentId);
  
  console.log('Tournament:', tournament?.name);
  console.log('Number of golfers:', golfers.length);
  console.log('Fat Rando stolen:', results?.fatRandoStolenGolfers?.length ?? 0, 'golfers');
  console.log('Team scores:', results?.teamScores);
  
  // Get a specific golfer's results
  const golferResult = results?.golferResults?.find(r => r.golferId === golfers[0].id);
  if (golferResult) {
    console.log('Golfer:', golfers[0].name);
    console.log('Final position:', golferResult.finalPosition);
    console.log('Rounds:', golferResult.rounds);
    console.log('Total points:', golferResult.totalPoints);
  }
}

// Example 2: Get all tournament data
export function getAllTournamentsExample() {
  const allData = getAllTournamentData();
  
  allData.forEach(({ tournament, golfers, results }) => {
    console.log(`\n${tournament.name}:`);
    console.log(`  Golfers: ${golfers.length}`);
    console.log(`  Team scores:`);
    results?.teamScores?.forEach(score => {
      const player = dummyPlayers.find(p => p.id === score.playerId);
      console.log(`    ${player?.name}: ${score.totalPoints} points`);
    });
  });
}

// Example 3: Calculate season standings
export function getSeasonStandings() {
  const allData = getAllTournamentData();
  const playerTotals = new Map<string, number>();
  
  allData.forEach(({ results }) => {
    results?.teamScores?.forEach(score => {
      const current = playerTotals.get(score.playerId) || 0;
      playerTotals.set(score.playerId, current + score.totalPoints);
    });
  });
  
  const standings = Array.from(playerTotals.entries())
    .map(([playerId, totalPoints]) => {
      const player = dummyPlayers.find(p => p.id === playerId);
      return {
        player,
        totalPoints,
        averagePoints: totalPoints / allData.length,
        tournamentsPlayed: allData.length,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
  
  return standings;
}

// Example 4: Get golfer performance across tournaments
export function getGolferPerformance(golferName: string) {
  const allData = getAllTournamentData();
  const performances: Array<{
    tournament: string;
    position: number | null;
    points: number;
  }> = [];
  
  allData.forEach(({ tournament, golfers, results }) => {
    const golfer = golfers.find(g => g.name === golferName);
    if (golfer && results) {
      const result = results.golferResults.find(r => r.golferId === golfer.id);
      if (result) {
        performances.push({
          tournament: tournament.name,
          position: result.finalPosition,
          points: result.totalPoints,
        });
      }
    }
  });
  
  return performances;
}
