import { Tournament, Golfer, TournamentResult, RoundScore } from './types';
import { SCORING } from './constants';
import { TOURNAMENT_SCHEDULE_2026 } from './tournamentSchedule';

// Fixed list of 100 golfer names for consistency
const GOLFER_NAMES = [
  'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Brooks Koepka', 'Jordan Spieth',
  'Justin Thomas', 'Dustin Johnson', 'Patrick Cantlay', 'Xander Schauffele', 'Collin Morikawa',
  'Viktor Hovland', 'Matt Fitzpatrick', 'Tommy Fleetwood', 'Tyrrell Hatton', 'Shane Lowry',
  'Cameron Smith', 'Sam Burns', 'Max Homa', 'Tony Finau', 'Sungjae Im',
  'Hideki Matsuyama', 'Jason Day', 'Adam Scott', 'Marc Leishman', 'Louis Oosthuizen',
  'Bryson DeChambeau', 'Daniel Berger', 'Keegan Bradley', 'Russell Henley', 'Brian Harman',
  'Harris English', 'Sepp Straka', 'Ludvig Aberg', 'Nicolai Hojgaard', 'Tom Kim',
  'Robert MacIntyre', 'Alex Noren', 'Aaron Wise', 'Sahith Theegala', 'Kurt Kitayama',
  'Andrew Novak', 'Michael Kim', 'Ben Griffin', 'Justin Rose', 'Gary Woodland',
  'Erik Van Rooyen', 'Joaquin Niemann', 'Taylor Pendrith', 'Wyndham Clark', 'Rickie Fowler',
  'Bubba Watson', 'Phil Mickelson', 'Tiger Woods', 'Fred Couples', 'Davis Love III',
  'Webb Simpson', 'Kevin Kisner', 'Billy Horschel', 'Stewart Cink', 'Charley Hoffman',
  'J.T. Poston', 'Brendon Todd', 'Emiliano Grillo', 'Francesco Molinari', 'Adrian Otaegui',
  'Rasmus Hojgaard', 'Thorbjorn Bjorn', 'Henrik Stenson', 'Sergio Garcia', 'Pablo Larrazabal',
  'Jorge Campillo', 'Carlos Ortiz', 'Miguel Ancer', 'Eduardo Rodriguez', 'Alejandro Cabrera Bello',
  'Rafael Paratore', 'Jose Schwartzel', 'Lucas Grace', 'Matthias Frittelli', 'Martin Higgo',
  'Thomas Pieters', 'Christiaan Willett', 'Dean Casey', 'Branden Westwood', 'Charl Poulter',
  'Ernie Rose', 'Retief Fitzpatrick', 'Louis Wallace', 'Dylan Fox', 'Garrick Power',
  'Cameron Young', 'Ryan Palmer', 'Brendan Steele', 'Lucas Glover', 'Maverick List',
  'Pierceson Hughes', 'Gordon Conners', 'Nick Taylor', 'Luke Donald', 'David Lingmerth',
  'Matt Kuchar', 'Zach Johnson', 'Jim Furyk', 'Steve Stricker', 'Stewart Cink'
];

// Fixed players
export const dummyPlayers = [
  { id: '1', name: 'MtyThor', imageUrl: '/images/Player_MtyThor.jpg' },
  { id: '2', name: 'Atticus', imageUrl: '/images/Player_Atticus.jpg' },
  { id: '3', name: 'KristaKay', imageUrl: '/images/Player_KristaKay.jpg' },
  { id: '4', name: 'MrHattyhat', imageUrl: '/images/Player_MrHattyhat.jpg' },
];

/** Re-export for backwards compatibility - tournaments come from the canonical schedule */
export const dummyTournaments = TOURNAMENT_SCHEDULE_2026;

// Helper function to generate odds string
function generateOdds(rank: number): string {
  if (rank <= 5) return `${3 + rank}/1`;
  if (rank <= 10) return `${10 + (rank - 5) * 2}/1`;
  if (rank <= 20) return `${20 + (rank - 10) * 3}/1`;
  if (rank <= 30) return `${50 + (rank - 20) * 5}/1`;
  if (rank <= 50) return `${100 + (rank - 30) * 10}/1`;
  return `${300 + (rank - 50) * 20}/1`;
}

// Helper function to generate round scores (deterministic)
// For rounds 1-2: generates scores based on golfer skill (rank)
// For rounds 3-4: generates scores based on final position (for those who made cut)
function generateRoundScores(round: number, golferIndex: number, golferRank: number, finalPosition?: number | null): RoundScore {
  // Rounds 1-2: Score based on golfer's skill/rank
  if (round <= 2) {
    // Better ranked golfers tend to score better
    let baseScore = 72;
    if (golferRank <= 5) baseScore = 68;
    else if (golferRank <= 10) baseScore = 69;
    else if (golferRank <= 20) baseScore = 70;
    else if (golferRank <= 30) baseScore = 71;
    else if (golferRank <= 50) baseScore = 72;
    else baseScore = 73;
    
    // Add deterministic variance based on golfer index and round
    const variance = ((golferIndex * 7 + round * 3) % 7) - 3; // -3 to +3
    const score = Math.max(65, Math.min(80, baseScore + variance));
    
    return {
      round,
      score,
      toPar: score - 72,
    };
  }
  
  // Rounds 3-4: Score based on final position (only for golfers who made cut)
  if (finalPosition === null || finalPosition === undefined) {
    return {
      round,
      score: 0,
      toPar: 0,
    };
  }
  
  let baseScore = 72;
  if (finalPosition <= 5) baseScore = 68;
  else if (finalPosition <= 10) baseScore = 69;
  else if (finalPosition <= 20) baseScore = 70;
  else if (finalPosition <= 30) baseScore = 71;
  else if (finalPosition <= 50) baseScore = 72;
  else baseScore = 73;
  
  // Add deterministic variance based on golfer index and round
  const variance = ((golferIndex * 7 + round * 3) % 5) - 2; // -2 to +2
  const score = Math.max(65, Math.min(80, baseScore + variance));
  
  return {
    round,
    score,
    toPar: score - 72,
  };
}

// Helper function to calculate points
function calculatePoints(finalPosition: number | null): { basePoints: number; bonusPoints: number; totalPoints: number } {
  if (finalPosition === null) {
    return { basePoints: 0, bonusPoints: 0, totalPoints: 0 };
  }
  
  const basePoints = SCORING.BASE_POINTS_FORMULA(finalPosition);
  let bonusPoints = 0;
  
  if (finalPosition === 1) {
    bonusPoints = SCORING.BONUS_POINTS.FIRST_PLACE;
  } else if (finalPosition >= 2 && finalPosition <= 5) {
    bonusPoints = SCORING.BONUS_POINTS.TOP_5;
  } else if (finalPosition >= 6 && finalPosition <= 10) {
    bonusPoints = SCORING.BONUS_POINTS.TOP_10;
  } else if (finalPosition >= 11 && finalPosition <= 20) {
    bonusPoints = SCORING.BONUS_POINTS.TOP_20;
  }
  
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
  };
}

// Generate golfers for a tournament
function generateGolfers(tournamentId: string): Golfer[] {
  return GOLFER_NAMES.map((name, index) => ({
    id: `golfer-${tournamentId}-${index + 1}`,
    name,
    rank: index + 1,
    odds: generateOdds(index + 1),
  }));
}

// Note: Final positions are now calculated dynamically based on scores
// Cut is applied after 2 rounds based on score, then final positions determined by 4-round totals

// Predefined Fat Rando stolen golfers for each tournament
// Tournaments 1-3: completed; 4: for seeding/testing
const FAT_RANDO_STOLEN: Record<string, number[]> = {
  '1': [2, 5, 12, 18], // Stolen at positions 2, 5, 12, 18
  '2': [1, 8, 15, 20],
  '3': [3, 7, 11, 19],
  '4': [4, 9, 14, 19], // U.S. OPEN - for seeding full results
  '9': [2, 8, 15, 22], // PRESIDENT'S CUP - match play format
};

// Predefined team drafts for each tournament
// Tournaments 1-3: completed; 4: for seeding/testing
const TEAM_DRAFTS: Record<string, Array<{ playerId: string; activeGolfers: number[]; alternateGolfer: number }>> = {
  '1': [
    { playerId: '1', activeGolfers: [1, 6, 13], alternateGolfer: 19 }, // MtyThor
    { playerId: '2', activeGolfers: [3, 7, 14], alternateGolfer: 20 }, // Atticus
    { playerId: '3', activeGolfers: [4, 8, 15], alternateGolfer: 21 }, // KristaKay
    { playerId: '4', activeGolfers: [9, 10, 16], alternateGolfer: 22 }, // MrHattyhat
  ],
  '2': [
    { playerId: '1', activeGolfers: [2, 6, 11], alternateGolfer: 17 },
    { playerId: '2', activeGolfers: [3, 9, 12], alternateGolfer: 18 },
    { playerId: '3', activeGolfers: [4, 7, 13], alternateGolfer: 19 },
    { playerId: '4', activeGolfers: [5, 10, 14], alternateGolfer: 20 },
  ],
  '3': [
    { playerId: '1', activeGolfers: [1, 8, 15], alternateGolfer: 22 },
    { playerId: '2', activeGolfers: [2, 9, 16], alternateGolfer: 23 },
    { playerId: '3', activeGolfers: [4, 10, 17], alternateGolfer: 24 },
    { playerId: '4', activeGolfers: [5, 11, 18], alternateGolfer: 25 },
  ],
  '4': [
    { playerId: '1', activeGolfers: [1, 6, 13], alternateGolfer: 20 },
    { playerId: '2', activeGolfers: [3, 7, 14], alternateGolfer: 21 },
    { playerId: '3', activeGolfers: [5, 8, 15], alternateGolfer: 22 },
    { playerId: '4', activeGolfers: [10, 11, 16], alternateGolfer: 23 },
  ],
  '9': [
    { playerId: '1', activeGolfers: [1, 6, 13], alternateGolfer: 20 },
    { playerId: '2', activeGolfers: [3, 7, 14], alternateGolfer: 21 },
    { playerId: '3', activeGolfers: [5, 8, 15], alternateGolfer: 22 },
    { playerId: '4', activeGolfers: [10, 11, 16], alternateGolfer: 23 },
  ],
};

// Generate tournament results
// Only generates results for completed tournaments (state === 'completed')
// When forceForSeeding is true, generates for any tournament that has FAT_RANDO_STOLEN and TEAM_DRAFTS
// When existing is provided (from a real draft), uses those teamDrafts and fatRandoStolenGolfers
export function generateTournamentResult(
  tournamentId: string,
  golfers: Golfer[],
  forceForSeeding?: boolean,
  existing?: ExistingDraftForSeeding
): TournamentResult | null {
  const tournament = dummyTournaments.find(t => t.id === tournamentId);
  const isCompleted = tournament?.state === 'completed';
  if (!tournament && !forceForSeeding) return null;
  if (!isCompleted && !forceForSeeding) return null;

  const cutLineScore = tournament?.cutLineScore;
  const stolenRanks = FAT_RANDO_STOLEN[tournamentId];
  const teamDraftsConfig = TEAM_DRAFTS[tournamentId];

  let stolenGolferIds: string[];
  if (existing?.fatRandoStolenGolfers?.length) {
    stolenGolferIds = existing.fatRandoStolenGolfers;
  } else if (stolenRanks) {
    stolenGolferIds = stolenRanks.map(rank => golfers[rank - 1]?.id).filter(Boolean);
  } else {
    return null;
  }
  
  // Step 1: Generate rounds 1-2 for all golfers (based on their skill/rank)
  const round1and2Results = golfers.map((golfer, index) => {
    const round1 = generateRoundScores(1, index, golfer.rank);
    const round2 = generateRoundScores(2, index, golfer.rank);
    const totalAfter2Rounds = round1.score + round2.score;
    const totalToParAfter2Rounds = round1.toPar + round2.toPar;
    
    return {
      golferId: golfer.id,
      golferIndex: index,
      round1,
      round2,
      totalAfter2Rounds,
      totalToParAfter2Rounds,
    };
  });
  
  // Step 2: Sort by score relative to par after 2 rounds and apply cut
  // Lower totalToPar (more negative) = better score
  const sortedByScore = [...round1and2Results].sort((a, b) => a.totalToParAfter2Rounds - b.totalToParAfter2Rounds);
  
  // Step 3: Determine who made the cut (score-based: golfers at cutLineScore or better)
  const cutMadeCut: Set<string> = new Set();
  if (cutLineScore === undefined) {
    // No cut - all golfers make it
    round1and2Results.forEach(r => cutMadeCut.add(r.golferId));
  } else {
    // cutLineScore of +4 means golfers at +4 or better (<= +4) make the cut
    round1and2Results.forEach(r => {
      if (r.totalToParAfter2Rounds <= cutLineScore) {
        cutMadeCut.add(r.golferId);
      }
    });
  }
  
  // Step 4: For golfers who made cut, assign target final positions based on 2-round performance
  // Then generate rounds 3-4 based on target position
  const sortedMadeCut = sortedByScore.filter(r => cutMadeCut.has(r.golferId));
  
  const fourRoundResults = round1and2Results.map((r) => {
    const madeCut = cutMadeCut.has(r.golferId);
    const rounds: RoundScore[] = [r.round1, r.round2];
    let totalScore = r.totalAfter2Rounds;
    let totalToPar = r.totalToParAfter2Rounds;
    let targetFinalPosition: number | null = null;
    
    if (madeCut) {
      // Find this golfer's rank among those who made cut (based on 2-round score relative to par)
      const rankInCut = sortedMadeCut.findIndex(s => s.golferId === r.golferId) + 1;
      targetFinalPosition = rankInCut; // This will be adjusted after 4 rounds
      
      // Generate rounds 3-4 based on target final position
      // Better final positions should have better rounds 3-4 scores
      const round3 = generateRoundScores(3, r.golferIndex, golfers[r.golferIndex].rank, targetFinalPosition);
      const round4 = generateRoundScores(4, r.golferIndex, golfers[r.golferIndex].rank, targetFinalPosition);
      rounds.push(round3, round4);
      totalScore += round3.score + round4.score;
      totalToPar += round3.toPar + round4.toPar;
    }
    
    return {
      golferId: r.golferId,
      golferIndex: r.golferIndex,
      rounds,
      totalScore,
      totalToPar,
      madeCut,
      targetFinalPosition,
    };
  });
  
  // Step 5: Sort by 4-round total relative to par to determine actual final positions
  // Lower totalToPar (more negative) = better score = better position
  const sortedByFinalScore = [...fourRoundResults]
    .filter(r => r.madeCut)
    .sort((a, b) => a.totalToPar - b.totalToPar);
  
  // Step 6: Assign final positions based on 4-round total
  const finalPositionsMap = new Map<string, number | null>();
  sortedByFinalScore.forEach((r, index) => {
    finalPositionsMap.set(r.golferId, index + 1);
  });
  fourRoundResults.forEach(r => {
    if (!r.madeCut) {
      finalPositionsMap.set(r.golferId, null);
    }
  });
  
  // Step 7: Regenerate rounds 3-4 based on ACTUAL final positions to ensure scores match positions
  // This ensures that golfers with better positions have better scores
  // We iterate through sortedByFinalScore in order (best to worst) and regenerate rounds 3-4
  const correctedResultsMap = new Map<string, typeof fourRoundResults[0] & { finalPosition: number | null }>();
  
  sortedByFinalScore.forEach((r, sortedIndex) => {
    const finalPosition = sortedIndex + 1; // Position 1, 2, 3, etc. based on sorted order
    const correctedRounds: RoundScore[] = [r.rounds[0], r.rounds[1]]; // Keep rounds 1-2
    let correctedTotalScore = r.rounds[0].score + r.rounds[1].score;
    let correctedTotalToPar = r.rounds[0].toPar + r.rounds[1].toPar;
    
    // Regenerate rounds 3-4 based on actual final position (which matches sorted order)
    const round3 = generateRoundScores(3, r.golferIndex, golfers[r.golferIndex].rank, finalPosition);
    const round4 = generateRoundScores(4, r.golferIndex, golfers[r.golferIndex].rank, finalPosition);
    correctedRounds.push(round3, round4);
    correctedTotalScore = correctedRounds[0].score + correctedRounds[1].score + round3.score + round4.score;
    correctedTotalToPar = correctedRounds[0].toPar + correctedRounds[1].toPar + round3.toPar + round4.toPar;
    
    correctedResultsMap.set(r.golferId, {
      ...r,
      rounds: correctedRounds,
      totalScore: correctedTotalScore,
      totalToPar: correctedTotalToPar,
      finalPosition,
    });
  });
  
  // Add missed cut golfers back with null positions
  fourRoundResults.forEach(r => {
    if (!r.madeCut && !correctedResultsMap.has(r.golferId)) {
      correctedResultsMap.set(r.golferId, {
        ...r,
        finalPosition: null,
      });
    }
  });
  
  // Step 8: Generate final golfer results with points
  const golferResults = Array.from(correctedResultsMap.values()).map((r) => {
    const finalPosition = r.finalPosition;
    const { basePoints, bonusPoints, totalPoints } = calculatePoints(finalPosition);
    
    return {
      golferId: r.golferId,
      finalPosition,
      rounds: r.rounds,
      totalScore: r.totalScore,
      totalToPar: r.totalToPar,
      madeCut: r.madeCut,
      basePoints,
      bonusPoints,
      totalPoints,
    };
  });
  
  // Create team drafts: use existing (from real draft) or predefined
  let teamDrafts: Array<{ playerId: string; activeGolfers: string[]; alternateGolfer: string }>;
  if (existing?.teamDrafts?.length) {
    teamDrafts = existing.teamDrafts.map((d) => ({
      playerId: d.playerId,
      activeGolfers: d.activeGolfers ?? [],
      alternateGolfer: d.alternateGolfer ?? '',
    }));
  } else if (teamDraftsConfig) {
    const availableGolfersSorted = golfers
      .filter((g, index) => !stolenRanks!.includes(index + 1))
      .sort((a, b) => a.rank - b.rank);
    teamDrafts = teamDraftsConfig.map((draft, playerIndex) => {
      const picksPerPlayer = 4;
      const startIndex = playerIndex * picksPerPlayer;
      const activeGolfers: string[] = [];
      for (let i = 0; i < 3; i++) {
        const golferIndex = (startIndex + i) % availableGolfersSorted.length;
        activeGolfers.push(availableGolfersSorted[golferIndex].id);
      }
      const alternateIndex = (startIndex + 3) % availableGolfersSorted.length;
      const alternateGolfer = availableGolfersSorted[alternateIndex].id;
      return { playerId: draft.playerId, activeGolfers, alternateGolfer };
    });
  } else {
    return null;
  }
  
  // Calculate team scores
  const teamScores = teamDrafts.map(draft => {
    const golferPoints = draft.activeGolfers.map(golferId => {
      const result = golferResults.find(r => r.golferId === golferId);
      if (!result || !result.madeCut) {
        // Check if alternate made cut and can substitute
        const alternateResult = golferResults.find(r => r.golferId === draft.alternateGolfer);
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
    tournamentId,
    fatRandoStolenGolfers: stolenGolferIds,
    teamDrafts,
    golferResults,
    teamScores,
  };
}

/**
 * Calculate team scores from team drafts and golfer results.
 * Used when draft completes after scores exist, or when recalculating.
 */
export function calculateTeamScoresFromDrafts(
  teamDrafts: Array<{ playerId: string; activeGolfers: string[]; alternateGolfer?: string }>,
  golferResults: Array<{ golferId: string; madeCut: boolean; totalPoints: number }>
): Array<{ playerId: string; totalPoints: number; golferPoints: Array<{ golferId: string; points: number }> }> {
  return teamDrafts.map((draft) => {
    const actives = draft.activeGolfers ?? [];
    const alternate = draft.alternateGolfer ?? '';
    const golferPoints = actives.map((golferId) => {
      const result = golferResults.find((r) => r.golferId === golferId);
      if (!result || !result.madeCut) {
        const alternateResult = golferResults.find((r) => r.golferId === alternate);
        if (alternateResult && alternateResult.madeCut) {
          return { golferId: alternate, points: alternateResult.totalPoints };
        }
        return { golferId, points: 0 };
      }
      return { golferId, points: result.totalPoints };
    });
    const totalPoints = golferPoints.reduce((sum, gp) => sum + gp.points, 0);
    return { playerId: draft.playerId, totalPoints, golferPoints };
  });
}

/**
 * Check if tournament is Ryder Cup or President's Cup (match play, different format).
 */
export function isRyderCup(tournamentId: string): boolean {
  const t = dummyTournaments.find((x) => x.id === tournamentId);
  const name = t?.name?.toUpperCase() ?? '';
  return name.includes('RYDER CUP') || name.includes("PRESIDENT'S CUP") || name.includes('PRESIDENTS CUP');
}

/** Optional existing draft data - when seeding scores after a real draft */
export interface ExistingDraftForSeeding {
  teamDrafts?: Array<{ playerId: string; activeGolfers: string[]; alternateGolfer?: string }>;
  fatRandoStolenGolfers?: string[];
}

/**
 * Generate partial results through a specific round for seeding/testing.
 * throughRound: 1|2|3|4 - cumulative rounds; cut applied after round 2 when applicable.
 * Tournaments without cutLineScore have no cut - all golfers get rounds 3-4.
 * When existing is provided (from a real draft), uses those teamDrafts and fatRandoStolenGolfers.
 */
export function generatePartialResults(
  tournamentId: string,
  golfers: Golfer[],
  throughRound: 1 | 2 | 3 | 4,
  existing?: ExistingDraftForSeeding
): TournamentResult | null {
  const tournament = dummyTournaments.find((t) => t.id === tournamentId);
  const stolenRanks = FAT_RANDO_STOLEN[tournamentId];
  const teamDraftsConfig = TEAM_DRAFTS[tournamentId];

  let teamDrafts: Array<{ playerId: string; activeGolfers: string[]; alternateGolfer: string }>;
  let stolenGolferIds: string[];

  if (existing?.teamDrafts?.length && existing?.fatRandoStolenGolfers) {
    teamDrafts = existing.teamDrafts.map((d) => ({
      playerId: d.playerId,
      activeGolfers: d.activeGolfers ?? [],
      alternateGolfer: d.alternateGolfer ?? '',
    }));
    stolenGolferIds = existing.fatRandoStolenGolfers;
  } else if (stolenRanks && teamDraftsConfig) {
    stolenGolferIds = stolenRanks.map((rank) => golfers[rank - 1]?.id).filter(Boolean);
    const availableGolfersSorted = golfers
      .filter((_, index) => !stolenRanks.includes(index + 1))
      .sort((a, b) => a.rank - b.rank);
    teamDrafts = teamDraftsConfig.map((draft, playerIndex) => {
      const picksPerPlayer = 4;
      const startIndex = playerIndex * picksPerPlayer;
      const activeGolfers: string[] = [];
      for (let i = 0; i < 3; i++) {
        const idx = (startIndex + i) % availableGolfersSorted.length;
        activeGolfers.push(availableGolfersSorted[idx].id);
      }
      const alternateGolfer = availableGolfersSorted[(startIndex + 3) % availableGolfersSorted.length].id;
      return { playerId: draft.playerId, activeGolfers, alternateGolfer };
    });
  } else {
    return null;
  }

  const cutLineScore = tournament?.cutLineScore;
  const hasCut = cutLineScore != null;

  const round1and2Results = golfers.map((golfer, index) => {
    const round1 = generateRoundScores(1, index, golfer.rank);
    const round2 = throughRound >= 2 ? generateRoundScores(2, index, golfer.rank) : null;
    const totalAfter2Rounds = round2 ? round1.score + round2.score : round1.score;
    const totalToParAfter2Rounds = round2 ? round1.toPar + round2.toPar : round1.toPar;
    return {
      golferId: golfer.id,
      golferIndex: index,
      round1,
      round2,
      totalAfter2Rounds,
      totalToParAfter2Rounds,
    };
  });

  const sortedByScore = [...round1and2Results].sort((a, b) => a.totalToParAfter2Rounds - b.totalToParAfter2Rounds);
  const cutMadeCut: Set<string> = new Set();
  if (!hasCut || throughRound < 2) {
    round1and2Results.forEach((r) => cutMadeCut.add(r.golferId));
  } else if (cutLineScore !== undefined) {
    round1and2Results.forEach((r) => {
      if (r.totalToParAfter2Rounds <= cutLineScore) cutMadeCut.add(r.golferId);
    });
  }

  const sortedMadeCut = sortedByScore.filter((r) => cutMadeCut.has(r.golferId));

  const golferResults = round1and2Results.map((r) => {
    const madeCut = cutMadeCut.has(r.golferId);
    const rounds: RoundScore[] = [r.round1];
    if (r.round2) rounds.push(r.round2);
    let totalScore = r.totalAfter2Rounds;
    let totalToPar = r.totalToParAfter2Rounds;
    let finalPosition: number | null = null;
    let basePoints = 0;
    let bonusPoints = 0;
    let totalPoints = 0;

    if (throughRound >= 3 && madeCut) {
      const rankAfter2 = sortedMadeCut.findIndex((s) => s.golferId === r.golferId) + 1;
      const round3 = generateRoundScores(3, r.golferIndex, golfers[r.golferIndex].rank, rankAfter2);
      rounds.push(round3);
      totalScore += round3.score;
      totalToPar += round3.toPar;
    }
    if (throughRound >= 4 && madeCut) {
      const r3Scores = new Map<string, number>();
      sortedMadeCut.forEach((s) => {
        const res = round1and2Results.find((x) => x.golferId === s.golferId)!;
        const rankAfter2 = sortedMadeCut.findIndex((x) => x.golferId === s.golferId) + 1;
        const r3 = generateRoundScores(3, res.golferIndex, golfers[res.golferIndex].rank, rankAfter2);
        r3Scores.set(s.golferId, res.totalToParAfter2Rounds + r3.toPar);
      });
      const sortedAfter3 = [...sortedMadeCut].sort(
        (a, b) => (r3Scores.get(a.golferId) ?? 0) - (r3Scores.get(b.golferId) ?? 0)
      );
      const pos = sortedAfter3.findIndex((s) => s.golferId === r.golferId) + 1;
      const round4 = generateRoundScores(4, r.golferIndex, golfers[r.golferIndex].rank, pos);
      rounds.push(round4);
      totalScore += round4.score;
      totalToPar += round4.toPar;
      finalPosition = pos;
      const pts = calculatePoints(pos);
      basePoints = pts.basePoints;
      bonusPoints = pts.bonusPoints;
      totalPoints = pts.totalPoints;
    }

    return {
      golferId: r.golferId,
      finalPosition,
      rounds,
      totalScore,
      totalToPar,
      madeCut,
      basePoints,
      bonusPoints,
      totalPoints,
    };
  });

  const teamScores = teamDrafts.map((draft) => {
    const golferPoints = draft.activeGolfers.map((golferId) => {
      const result = golferResults.find((r) => r.golferId === golferId);
      if (!result || !result.madeCut || result.totalPoints === 0) {
        const alt = golferResults.find((r) => r.golferId === draft.alternateGolfer);
        if (alt?.madeCut && alt.totalPoints > 0) {
          return { golferId: draft.alternateGolfer, points: alt.totalPoints };
        }
        return { golferId, points: 0 };
      }
      return { golferId, points: result.totalPoints };
    });
    return {
      playerId: draft.playerId,
      totalPoints: golferPoints.reduce((s, g) => s + g.points, 0),
      golferPoints,
    };
  });

  return {
    tournamentId,
    fatRandoStolenGolfers: stolenGolferIds,
    teamDrafts,
    golferResults,
    teamScores,
  };
}

// Generate golfers and results for each tournament
export const dummyGolfers: Record<string, Golfer[]> = {};
export const dummyTournamentResults: Record<string, TournamentResult | null> = {};

dummyTournaments.forEach(tournament => {
  // Generate golfers for all tournaments
  const golfers = generateGolfers(tournament.id);
  dummyGolfers[tournament.id] = golfers;
  
  // Only generate results for completed tournaments
  const results = generateTournamentResult(tournament.id, golfers);
  if (results) {
    dummyTournamentResults[tournament.id] = results;
  } else {
    dummyTournamentResults[tournament.id] = null;
  }
});

// Helper function to get tournament data
export function getTournamentData(tournamentId: string) {
  return {
    tournament: dummyTournaments.find(t => t.id === tournamentId),
    golfers: dummyGolfers[tournamentId] || [],
    results: dummyTournamentResults[tournamentId] || null,
  };
}

// Helper function to get current tournament (U.S. OPEN - Event 4)
export function getCurrentTournament() {
  return dummyTournaments.find(t => t.id === '4') || dummyTournaments[0];
}

// Helper function to get completed tournaments
export function getCompletedTournaments() {
  return dummyTournaments.filter(t => t.state === 'completed');
}

// Helper function to get upcoming/pre-draft tournaments
export function getUpcomingTournaments() {
  return dummyTournaments.filter(t => t.state === 'pre-draft');
}

// Helper function to get all tournament data
export function getAllTournamentData() {
  return dummyTournaments.map(tournament => ({
    tournament,
    golfers: dummyGolfers[tournament.id] || [],
    results: dummyTournamentResults[tournament.id],
  }));
}
