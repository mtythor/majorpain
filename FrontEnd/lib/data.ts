/**
 * Data layer: single source for all app data.
 *
 * All data comes from the API (Postgres or file backend via api-db).
 * Hooks (useApiData, useTournamentData) fetch and populate the cache.
 * This module exposes synchronous getters that read from the cache.
 * getCurrentUser falls back to dummyPlayers when no user is loaded.
 */

import { dummyPlayers } from './dummyData';
import type { Tournament, Golfer, Player, TournamentResult } from './types';
import { pointsFromPosition } from './constants';
import { mergeTournamentsWithSchedule } from './tournamentSchedule';

// Re-export types used by pages
export type { Tournament, Golfer, Player, TournamentResult };

// Cache for API data (populated by useApiData/useTournamentData hooks)
let dataCache: {
  tournaments?: Tournament[];
  players?: Player[];
  currentUser?: Player;
  [key: string]: any;
} = {};

// Function to update cache (exported for use by hooks)
export function updateDataCache(key: string, value: any) {
  dataCache[key] = value;
}

// Function to get cache (exported for debugging)
export function getDataCache() {
  return dataCache;
}

// Function to clear cache (exported for debugging/testing)
export function clearDataCache() {
  dataCache = {};
}

// --- Public API (pages import only from here) ---
// For backward compatibility, these functions are synchronous when using dummy data
// and return cached data when using API client (populated by hooks)

export function persistAdminOverrides(_tournaments: Tournament[]) {
  // No-op: state persisted via API. Kept for compatibility.
}

export function getTournaments(): Tournament[] {
  const stored = dataCache.tournaments || [];
  return mergeTournamentsWithSchedule(stored.length ? stored : []);
}

export function getTournament(id: string): Tournament | undefined {
  return getTournaments().find((t) => t.id === id);
}

export function getGolfers(tournamentId: string): Golfer[] {
  return dataCache[`golfers-${tournamentId}`] || [];
}

export function getTournamentResult(tournamentId: string): TournamentResult | null {
  return dataCache[`results-${tournamentId}`] ?? null;
}

export function getPlayers(): Player[] {
  return dataCache.players || [];
}

export function getCurrentUser(): Player {
  return dataCache.currentUser || dataCache.players?.[0] || dummyPlayers[0];
}

export function getTournamentData(tournamentId: string) {
  return {
    tournament: getTournament(tournamentId),
    golfers: getGolfers(tournamentId),
    results: getTournamentResult(tournamentId),
  };
}

export function getCurrentTournament() {
  const tournaments = getTournaments();
  return tournaments.find(t => t.id === '4') || tournaments[0];
}

export function getCompletedTournaments() {
  const tournaments = getTournaments();
  return tournaments.filter(t => t.state === 'completed');
}

// Helper function for getAllTournamentData (used by getSeasonStandings)
function getAllTournamentData() {
  const tournaments = getTournaments();
  return tournaments.map(tournament => ({
    tournament,
    golfers: dataCache[`golfers-${tournament.id}`] || [],
    results: dataCache[`results-${tournament.id}`] ?? null,
  }));
}


// --- Substitution helpers ---

export function isAfterRound2(results: TournamentResult): boolean {
  return results.golferResults.some((gr) => (gr.rounds?.length ?? 0) >= 2);
}

export function isSubWindowOpen(tournament: Tournament): boolean {
  if (!tournament.startDate) return false;
  const cutoff = new Date(tournament.startDate + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() + 2); // midnight at start of day 3 (Saturday)
  cutoff.setHours(0, 0, 0, 0);
  return new Date() < cutoff;
}

export function getVoluntarySubEligiblePlayerIds(tournamentId: string): string[] {
  const { tournament, results } = getTournamentData(tournamentId);
  if (!results || !tournament) return [];
  if (!isAfterRound2(results)) return [];
  if (!isSubWindowOpen(tournament)) return [];

  return results.teamDrafts
    .filter((draft) => {
      if (draft.playerId === '5') return false; // Fat Rando never eligible
      if (draft.substitutions?.length) return false; // sub already made
      const allActivesMadeCut = draft.activeGolfers.every((golferId) => {
        const gr = results.golferResults.find((r) => r.golferId === golferId);
        return gr?.madeCut === true;
      });
      if (!allActivesMadeCut) return false;
      const alternateResult = results.golferResults.find((r) => r.golferId === draft.alternateGolfer);
      return alternateResult?.madeCut === true;
    })
    .map((draft) => draft.playerId);
}

// --- Adapters: shape dummy data for specific UI components ---

/** Shape for SeasonTable (season page) */
export interface PlayerSeasonRow {
  playerId: string;
  playerName: string;
  playerImage: string;
  playerColor: string;
  tournamentScores: Array<{ score: number | null; hasTrophy?: boolean }>;
  seasonAverage: number;
  seasonPoints: number;
}

const PLAYER_COLORS: Record<string, string> = {
  '1': 'mtythor',
  '2': 'atticus',
  '3': 'kristakay',
  '4': 'mrhattyhat',
  '5': 'fatrando',
};

export function getSeasonStandings(): PlayerSeasonRow[] {
  const allData = getAllTournamentData();
  const allTournaments = allData.map((d) => d.tournament);

  // Only include tournaments that are complete (have final results with non-zero scores)
  const completed = allData.filter((d) => {
    if (!d.results?.teamScores?.length) return false;
    const hasFinalScores = d.results.teamScores.some((ts: { totalPoints: number }) => ts.totalPoints > 0);
    return hasFinalScores;
  });

  // Map tournament index to score and trophy for each player
  const byPlayer = new Map<string, { scores: Map<number, number>; trophies: Set<number> }>();

  completed.forEach(({ results, tournament }) => {
    if (!results?.teamScores?.length) return;
    const tournamentIndex = allTournaments.findIndex((t) => t.id === tournament.id);
    if (tournamentIndex === -1) return;

    const sorted = [...results.teamScores].sort(
      (a, b) => b.totalPoints - a.totalPoints
    );
    // Fat Rando (playerId '5') is never eligible to win - exclude from trophy
    const winnerId = sorted.find((ts: { playerId: string }) => ts.playerId !== '5')?.playerId ?? null;

    results.teamScores.forEach((ts: { playerId: string; totalPoints: number }) => {
      const entry = byPlayer.get(ts.playerId) ?? {
        scores: new Map<number, number>(),
        trophies: new Set<number>(),
      };
      entry.scores.set(tournamentIndex, ts.totalPoints);
      if (winnerId && ts.playerId === winnerId) {
        entry.trophies.add(tournamentIndex);
      }
      byPlayer.set(ts.playerId, entry);
    });

    // Compute Fat Rando's score from their stolen golfers (teamScores only has the 4 players)
    const fatRandoGolferIds = results.fatRandoStolenGolfers?.slice(0, 3) ?? [];
    if (fatRandoGolferIds.length > 0 && results.golferResults) {
      const fatRandoTotal = fatRandoGolferIds.reduce((sum: number, golferId: string) => {
        const gr = results.golferResults.find((r: { golferId: string; totalPoints?: number }) => r.golferId === golferId);
        return sum + (gr?.totalPoints ?? 0);
      }, 0);
      const fatRandoEntry = byPlayer.get('5') ?? {
        scores: new Map<number, number>(),
        trophies: new Set<number>(),
      };
      fatRandoEntry.scores.set(tournamentIndex, fatRandoTotal);
      byPlayer.set('5', fatRandoEntry);
    }
  });

  const players = getPlayers();
  const rows: PlayerSeasonRow[] = players.map((player) => {
    const entry = byPlayer.get(player.id) ?? {
      scores: new Map<number, number>(),
      trophies: new Set<number>(),
    };

    // Create scores array for all tournaments, with null for incomplete tournaments
    const tournamentScores = allTournaments.map((_, tournamentIndex) => {
      const score = entry.scores.get(tournamentIndex);
      return {
        score: score ?? null,
        hasTrophy: entry.trophies.has(tournamentIndex),
      };
    });

    const completedScores = Array.from(entry.scores.values());
    const seasonPoints = completedScores.reduce((a, b) => a + b, 0);
    const seasonAverage =
      completedScores.length > 0 ? Math.round(seasonPoints / completedScores.length) : 0;

    return {
      playerId: player.id,
      playerName: player.name,
      playerImage: player.imageUrl,
      playerColor: PLAYER_COLORS[player.id] ?? 'mtythor',
      tournamentScores,
      seasonAverage,
      seasonPoints,
    };
  });

  // Always add Fat Rando row (never eligible for trophy)
  const fatRandoEntry = byPlayer.get('5') ?? {
    scores: new Map<number, number>(),
    trophies: new Set<number>(),
  };
  const tournamentScores = allTournaments.map((_, tournamentIndex) => {
    const score = fatRandoEntry.scores.get(tournamentIndex);
    return {
      score: score ?? null,
      hasTrophy: false, // Fat Rando never gets the trophy
    };
  });
  const fatRandoCompletedScores = Array.from(fatRandoEntry.scores.values());
  const fatRandoSeasonPoints = fatRandoCompletedScores.reduce((a, b) => a + b, 0);
  const fatRandoSeasonAverage =
    fatRandoCompletedScores.length > 0
      ? Math.round(fatRandoSeasonPoints / fatRandoCompletedScores.length)
      : 0;

  rows.push({
    playerId: '5',
    playerName: 'Fat Rando',
    playerImage: '/images/Player_FatRando.jpg',
    playerColor: 'fatrando',
    tournamentScores,
    seasonAverage: fatRandoSeasonAverage,
    seasonPoints: fatRandoSeasonPoints,
  });

  // Sort: four players by season points, Fat Rando always last
  return rows.sort((a, b) => {
    if (a.playerId === '5') return 1;
    if (b.playerId === '5') return -1;
    return b.seasonPoints - a.seasonPoints;
  });
}

export function getSeasonTournamentNames(): string[] {
  const tournaments = getTournaments();
  return tournaments.map((t) => t.name);
}

/** Shape for PlayerCards (tournament list view) */
export interface PlayerCardRow {
  id: string;
  name: string;
  imageUrl: string;
  avgPos: number;
  points: number;
  bonus: number;
  total: number;
  color: string;
  golfers: Array<{ rank: number; name: string; status?: 'out' | 'alt' | 'cut' | 'wd' }>;
  hasResults?: boolean; // Whether results exist (if false, show -- instead of 0)
}

const CARD_COLORS: Record<string, string> = {
  '1': '#74a553',
  '2': '#3ca1ff',
  '3': '#e12c55',
  '4': '#ff7340',
  '5': '#88584d',
};

export function getPlayerCardsForTournament(tournamentId: string): PlayerCardRow[] {
  const { golfers, results } = getTournamentData(tournamentId);
  
  const teamDrafts = results?.teamDrafts;
  if (!teamDrafts || teamDrafts.length === 0) return [];

  const players = getPlayers();
  // Check if we have golfer results (rounds) - this indicates tournament has started
  const hasGolferResults = results?.golferResults && results.golferResults.length > 0 && 
    results.golferResults.some(gr => gr.rounds && gr.rounds.length > 0);
  const hasResults = results?.teamScores && results.teamScores.length > 0;
  
  const cards: PlayerCardRow[] = teamDrafts.map((draft) => {
    const player = players.find((p) => p.id === draft.playerId);
    if (!player) return null;
    
    const teamScore = hasResults ? results.teamScores.find((ts) => ts.playerId === draft.playerId) : null;
    
    // If no final results yet, we can still show the card with draft data and round scores if available
    if (!hasResults) {
      // Use totalToPar for position when available (multi-round), else round 1 only
      const useTotalScore = results?.golferResults?.some(r => r.totalToPar !== undefined) ?? false;
      const golfersWithRounds = (results?.golferResults ?? []).filter(r => r.rounds?.length > 0);
      const sortedByScore = [...golfersWithRounds].sort((a, b) => {
        if (useTotalScore && a.totalToPar != null && b.totalToPar != null) return a.totalToPar - b.totalToPar;
        const aScore = a.rounds[0]?.toPar ?? 999;
        const bScore = b.rounds[0]?.toPar ?? 999;
        return aScore - bScore;
      });
      const positionMap = new Map<string, number>();
      let pos = 1;
      for (let i = 0; i < sortedByScore.length; i++) {
        if (i > 0) {
          const curr = useTotalScore && sortedByScore[i].totalToPar != null ? sortedByScore[i].totalToPar : sortedByScore[i].rounds[0]?.toPar ?? 999;
          const prev = useTotalScore && sortedByScore[i - 1].totalToPar != null ? sortedByScore[i - 1].totalToPar : sortedByScore[i - 1].rounds[0]?.toPar ?? 999;
          if (curr !== prev) pos = i + 1;
        }
        positionMap.set(sortedByScore[i].golferId, pos);
      }

      const golfersList: PlayerCardRow['golfers'] = [];
      let playerPoints = 0;
      let playerBonus = 0;
      let playerTotal = 0;
      let posSum = 0;
      let posCount = 0;

      // Add all 3 active golfers
      draft.activeGolfers.forEach((golferId) => {
        const golfer = golfers.find((g) => g.id === golferId);
        if (golfer) {
          const rank = positionMap.get(golferId) ?? 0;
          const pts = rank > 0 ? pointsFromPosition(rank) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 };
          if (rank > 0) {
            posSum += rank;
            posCount++;
          }
          golfersList.push({
            rank,
            name: golfer.name,
            status: undefined,
          });
          // Only top 3 count for player total
          if (golfersList.length <= 3) {
            playerPoints += pts.basePoints;
            playerBonus += pts.bonusPoints;
            playerTotal += pts.totalPoints;
          }
        }
      });

      // Add alternate golfer (alternate doesn't count toward player total)
      const alternateGolfer = golfers.find((g) => g.id === draft.alternateGolfer);
      if (alternateGolfer) {
        const rank = positionMap.get(draft.alternateGolfer) ?? 0;
        golfersList.push({
          rank,
          name: alternateGolfer.name,
          status: 'alt' as const,
        });
      }

      const avgPos = posCount > 0 ? Math.round(posSum / posCount) : 0;

      return {
        id: player.id,
        name: player.name,
        imageUrl: player.imageUrl,
        avgPos,
        points: playerPoints,
        bonus: playerBonus,
        total: playerTotal,
        color: CARD_COLORS[player.id] || '#666666',
        golfers: golfersList,
        hasResults: false,
      };
    }
    
    // Original logic for when results exist
    if (!teamScore) return null;

    // Build position map for when stored points are 0 (partial results)
    const useTotalScore = results?.golferResults?.some(r => r.totalToPar !== undefined) ?? false;
    const golfersWithRounds = (results?.golferResults ?? []).filter(r => r.rounds?.length > 0);
    const sortedByScore = [...golfersWithRounds].sort((a, b) => {
      if (useTotalScore && a.totalToPar != null && b.totalToPar != null) return a.totalToPar - b.totalToPar;
      const aScore = a.rounds[0]?.toPar ?? 999;
      const bScore = b.rounds[0]?.toPar ?? 999;
      return aScore - bScore;
    });
    const positionMap = new Map<string, number>();
    let pos = 1;
    for (let i = 0; i < sortedByScore.length; i++) {
      if (i > 0) {
        const curr = useTotalScore && sortedByScore[i].totalToPar != null ? sortedByScore[i].totalToPar : sortedByScore[i].rounds[0]?.toPar ?? 999;
        const prev = useTotalScore && sortedByScore[i - 1].totalToPar != null ? sortedByScore[i - 1].totalToPar : sortedByScore[i - 1].rounds[0]?.toPar ?? 999;
        if (curr !== prev) pos = i + 1;
      }
      positionMap.set(sortedByScore[i].golferId, pos);
    }

    const sub = draft.substitutions?.[0];
    const golfersList: PlayerCardRow['golfers'] = [];

    // Add all 3 active golfers
    draft.activeGolfers.forEach((golferId) => {
      const golfer = golfers.find((g) => g.id === golferId);
      const gr = results.golferResults.find((r) => r.golferId === golferId);

      if (golfer && gr) {
        const rank = gr.finalPosition ?? positionMap.get(golferId) ?? 0;
        if (sub && golferId === sub.replacedGolferId) {
          golfersList.push({ rank, name: golfer.name, status: 'out' as const });
        } else {
          golfersList.push({
            rank,
            name: golfer.name,
            status: gr.status === 'withdrawn' ? 'wd' as const : gr.madeCut ? undefined : 'cut' as const,
          });
        }
      }
    });

    // Alternate: show as active scorer (no 'alt') if sub was made, otherwise as 'alt'
    const alternateGolfer = golfers.find((g) => g.id === draft.alternateGolfer);
    const alternateResult = results.golferResults.find((r) => r.golferId === draft.alternateGolfer);

    if (alternateGolfer && alternateResult) {
      const rank = alternateResult.finalPosition ?? positionMap.get(draft.alternateGolfer) ?? 0;
      golfersList.push({
        rank,
        name: alternateGolfer.name,
        status: sub
          ? (alternateResult.status === 'withdrawn' ? 'wd' as const : alternateResult.madeCut ? undefined : 'cut' as const)
          : 'alt' as const,
      });
    }

    // Calculate points
    // When a voluntary sub exists, compute directly from effective active golfers (bypass stored teamScores
    // which may predate the sub). Otherwise use stored teamScores which handle cut protection correctly.
    let totalPoints = 0;
    let totalBonus = 0;
    let posSum = 0;
    let posCount = 0;

    if (sub) {
      const effectiveActives = draft.activeGolfers.map((id) =>
        id === sub.replacedGolferId ? sub.replacementGolferId : id
      );
      effectiveActives.forEach((golferId) => {
        const gr = results.golferResults.find((r) => r.golferId === golferId);
        if (gr) {
          const position = gr.finalPosition ?? positionMap.get(golferId);
          if (gr.totalPoints > 0) {
            totalPoints += gr.totalPoints;
            totalBonus += gr.bonusPoints;
          } else if (position != null) {
            const pts = pointsFromPosition(position);
            totalPoints += pts.totalPoints;
            totalBonus += pts.bonusPoints;
          }
          if (position != null) { posSum += position; posCount++; }
        }
      });
    } else {
      teamScore.golferPoints.forEach((gp) => {
        const gr = results.golferResults.find((r) => r.golferId === gp.golferId);
        if (gr) {
          if (gr.totalPoints > 0) {
            totalPoints += gp.points;
            totalBonus += gr.bonusPoints;
          } else {
            const position = gr.finalPosition ?? positionMap.get(gp.golferId);
            if (position != null) {
              const pts = pointsFromPosition(position);
              totalPoints += pts.totalPoints;
              totalBonus += pts.bonusPoints;
            }
          }
          const position = gr.finalPosition ?? positionMap.get(gp.golferId);
          if (position != null) { posSum += position; posCount++; }
        }
      });
    }

    const basePoints = totalPoints - totalBonus;
    const avgPos = posCount > 0 ? Math.round(posSum / posCount) : 0;

    return {
      id: player.id,
      name: player.name,
      imageUrl: player.imageUrl,
      avgPos,
      points: basePoints,
      bonus: totalBonus,
      total: totalPoints,
      color: CARD_COLORS[player.id] ?? '#888',
      golfers: golfersList,
      hasResults: true,
    };
  }).filter(Boolean) as PlayerCardRow[];

  // Add Fat Rando (player ID '5')
  const fatRandoStolenGolfers: string[] = results?.fatRandoStolenGolfers ?? [];
  
  if (fatRandoStolenGolfers.length > 0) {
    const fatRandoGolfers = fatRandoStolenGolfers.slice(0, 4);
    
    // If no results yet, show Fat Rando card with draft data and position-based scores
    if (!hasResults) {
      const useTotalScore = results?.golferResults?.some(r => r.totalToPar !== undefined) ?? false;
      const golfersWithRounds = (results?.golferResults ?? []).filter(r => r.rounds?.length > 0);
      const sortedByScore = [...golfersWithRounds].sort((a, b) => {
        if (useTotalScore && a.totalToPar != null && b.totalToPar != null) return a.totalToPar - b.totalToPar;
        const aScore = a.rounds[0]?.toPar ?? 999;
        const bScore = b.rounds[0]?.toPar ?? 999;
        return aScore - bScore;
      });
      const positionMap = new Map<string, number>();
      let pos = 1;
      for (let i = 0; i < sortedByScore.length; i++) {
        if (i > 0) {
          const curr = useTotalScore && sortedByScore[i].totalToPar != null ? sortedByScore[i].totalToPar : sortedByScore[i].rounds[0]?.toPar ?? 999;
          const prev = useTotalScore && sortedByScore[i - 1].totalToPar != null ? sortedByScore[i - 1].totalToPar : sortedByScore[i - 1].rounds[0]?.toPar ?? 999;
          if (curr !== prev) pos = i + 1;
        }
        positionMap.set(sortedByScore[i].golferId, pos);
      }

      const fatRandoGolferData = fatRandoGolfers.map((golferId, index) => {
        const golfer = golfers.find((g) => g.id === golferId);
        if (!golfer) return null;
        const rank = positionMap.get(golferId) ?? 0;
        return {
          rank,
          name: golfer.name,
          status: index === 3 ? 'alt' as const : undefined,
        };
      }).filter((g): g is NonNullable<typeof g> => g !== null);

      const activeGolferData = fatRandoGolferData.slice(0, 3);
      let fatRandoBase = 0;
      let fatRandoBonus = 0;
      let posSum = 0;
      let posCount = 0;
      activeGolferData.forEach((g) => {
        if (g.rank > 0) {
          const pts = pointsFromPosition(g.rank);
          fatRandoBase += pts.basePoints;
          fatRandoBonus += pts.bonusPoints;
          posSum += g.rank;
          posCount++;
        }
      });
      const fatRandoAvgPos = posCount > 0 ? Math.round(posSum / posCount) : 0;
      
      cards.push({
        id: '5',
        name: 'Fat Rando',
        imageUrl: '/images/Player_FatRando.jpg',
        avgPos: fatRandoAvgPos,
        points: fatRandoBase,
        bonus: fatRandoBonus,
        total: fatRandoBase + fatRandoBonus,
        color: CARD_COLORS['5'] || '#88584d',
        golfers: fatRandoGolferData,
        hasResults: false,
      });
    } else {
      // Build position map for when stored points are 0 (partial results)
      const useTotalScore = results?.golferResults?.some(r => r.totalToPar !== undefined) ?? false;
      const golfersWithRounds = (results?.golferResults ?? []).filter(r => r.rounds?.length > 0);
      const sortedByScore = [...golfersWithRounds].sort((a, b) => {
        if (useTotalScore && a.totalToPar != null && b.totalToPar != null) return a.totalToPar - b.totalToPar;
        const aScore = a.rounds[0]?.toPar ?? 999;
        const bScore = b.rounds[0]?.toPar ?? 999;
        return aScore - bScore;
      });
      const positionMap = new Map<string, number>();
      let pos = 1;
      for (let i = 0; i < sortedByScore.length; i++) {
        if (i > 0) {
          const curr = useTotalScore && sortedByScore[i].totalToPar != null ? sortedByScore[i].totalToPar : sortedByScore[i].rounds[0]?.toPar ?? 999;
          const prev = useTotalScore && sortedByScore[i - 1].totalToPar != null ? sortedByScore[i - 1].totalToPar : sortedByScore[i - 1].rounds[0]?.toPar ?? 999;
          if (curr !== prev) pos = i + 1;
        }
        positionMap.set(sortedByScore[i].golferId, pos);
      }

      const fatRandoGolferData = fatRandoGolfers.map((golferId, index) => {
        const golferResult = results?.golferResults?.find((r) => r.golferId === golferId);
        const golfer = golfers.find((g) => g.id === golferId);
        
        if (!golferResult || !golfer) {
          return null;
        }

        const rank = golferResult.finalPosition ?? positionMap.get(golferId) ?? 0;
        const cutOrWd = golferResult.status === 'withdrawn' ? 'wd' as const : 'cut' as const;
        return {
          rank,
          name: golfer.name,
          status: index === 3 
            ? (golferResult.madeCut ? 'alt' as const : cutOrWd)
            : (golferResult.madeCut ? undefined : cutOrWd),
        };
      }).filter((g): g is NonNullable<typeof g> => g !== null);

      // Calculate Fat Rando totals (use top 3 golfers for scoring)
      const activeGolferIds = fatRandoGolfers.slice(0, 3);
      const activeGolferResults = activeGolferIds.map((golferId) => 
        results?.golferResults?.find((r) => r.golferId === golferId)
      ).filter((r): r is NonNullable<typeof r> => r !== null);
    
      const fatRandoPositions = activeGolferResults.map((r) => 
        r.finalPosition ?? positionMap.get(r.golferId)
      ).filter((p): p is number => p !== null && p !== undefined);
    
      const fatRandoAvgPos = fatRandoPositions.length > 0
        ? Math.round(fatRandoPositions.reduce((sum, p) => sum + p, 0) / fatRandoPositions.length)
        : 0;
    
      let fatRandoPoints = 0;
      let fatRandoBonus = 0;
      activeGolferResults.forEach((r) => {
        if (r.totalPoints > 0) {
          fatRandoPoints += r.basePoints;
          fatRandoBonus += r.bonusPoints;
        } else {
          const position = r.finalPosition ?? positionMap.get(r.golferId);
          if (position != null) {
            const pts = pointsFromPosition(position);
            fatRandoPoints += pts.basePoints;
            fatRandoBonus += pts.bonusPoints;
          }
        }
      });

      cards.push({
        id: '5',
        name: 'Fat Rando',
        imageUrl: '/images/Player_FatRando.jpg',
        avgPos: fatRandoAvgPos,
        points: fatRandoPoints,
        bonus: fatRandoBonus,
        total: fatRandoPoints + fatRandoBonus,
        color: CARD_COLORS['5'] || '#88584d',
        golfers: fatRandoGolferData,
        hasResults: true,
      });
    }
  }

  // Sort cards by total score (descending), but always put Fat Rando at the bottom
  cards.sort((a, b) => {
    // Fat Rando (id === '5') always goes to the bottom
    if (a.id === '5') return 1;
    if (b.id === '5') return -1;
    // Otherwise sort by total score descending
    return b.total - a.total;
  });

  return cards;
}
