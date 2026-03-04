import { Golfer, Player, DraftEvent, TeamDraft } from './types';
import { DraftState, DraftPick } from './draft-types';
import { getTournaments, getTournamentResult, getPlayers } from './data';

/**
 * Generate Fat Rando steals using progressive random selection
 * Steal #1: Random 1-5
 * Steal #2: Random 1-10 (from remaining)
 * Steal #3: Random 1-15 (from remaining)
 * Steal #4: Random 1-20 (from remaining)
 */
export function generateFatRandoSteals(golfers: Golfer[]): string[] {
  // Golfers are already sorted by rank (favorite to longshot)
  const available = [...golfers];
  const stolen: string[] = [];
  
  // Steal #1: Random 1-5
  const steal1 = Math.floor(Math.random() * Math.min(5, available.length));
  stolen.push(available[steal1].id);
  available.splice(steal1, 1);
  
  // Steal #2: Random 1-10 (from remaining)
  const steal2 = Math.floor(Math.random() * Math.min(10, available.length));
  stolen.push(available[steal2].id);
  available.splice(steal2, 1);
  
  // Steal #3: Random 1-15 (from remaining)
  const steal3 = Math.floor(Math.random() * Math.min(15, available.length));
  stolen.push(available[steal3].id);
  available.splice(steal3, 1);
  
  // Steal #4: Random 1-20 (from remaining)
  const steal4 = Math.floor(Math.random() * Math.min(20, available.length));
  stolen.push(available[steal4].id);
  
  return stolen;
}

/**
 * Get the winner of the most recent completed tournament
 */
function getPreviousTournamentWinner(currentTournamentId: string): string | undefined {
  const tournaments = getTournaments();
  const currentIndex = tournaments.findIndex(t => t.id === currentTournamentId);
  
  // Find the most recent completed tournament before the current one
  for (let i = currentIndex - 1; i >= 0; i--) {
    const tournament = tournaments[i];
    const results = getTournamentResult(tournament.id);
    
    if (results && results.teamScores && results.teamScores.length > 0) {
      // Sort by totalPoints descending to find winner
      const sorted = [...results.teamScores].sort((a, b) => b.totalPoints - a.totalPoints);
      return sorted[0]?.playerId;
    }
  }
  
  return undefined;
}

/**
 * Calculate snake draft order based on previous tournament winner
 * Order: Winner → 2nd → 3rd → 4th → 4th → 3rd → 2nd → 1st (repeats for 4 picks per player)
 */
export function calculateDraftOrder(players: Player[], currentTournamentId: string): string[] {
  const previousWinnerId = getPreviousTournamentWinner(currentTournamentId);
  
  // If no previous winner, use default order (player IDs 1, 2, 3, 4)
  if (!previousWinnerId) {
    const defaultOrder: string[] = [];
    const numPicks = 4; // 3 active + 1 alternate per player
    
    for (let round = 0; round < numPicks; round++) {
      if (round % 2 === 0) {
        // Forward order
        players.forEach(p => defaultOrder.push(p.id));
      } else {
        // Reverse order
        for (let i = players.length - 1; i >= 0; i--) {
          defaultOrder.push(players[i].id);
        }
      }
    }
    return defaultOrder;
  }
  
  // Find winner index
  const winnerIndex = players.findIndex(p => p.id === previousWinnerId);
  if (winnerIndex === -1) {
    // Winner not found, use default order (player IDs 1, 2, 3, 4)
    const defaultOrder: string[] = [];
    const numPicks = 4; // 3 active + 1 alternate per player
    
    for (let round = 0; round < numPicks; round++) {
      if (round % 2 === 0) {
        // Forward order
        players.forEach(p => defaultOrder.push(p.id));
      } else {
        // Reverse order
        for (let i = players.length - 1; i >= 0; i--) {
          defaultOrder.push(players[i].id);
        }
      }
    }
    return defaultOrder;
  }
  
  // Snake draft order: Winner → 2nd → 3rd → 4th → 4th → 3rd → 2nd → 1st
  const order: string[] = [];
  const numPicks = 4; // 3 active + 1 alternate per player
  
  for (let round = 0; round < numPicks; round++) {
    if (round % 2 === 0) {
      // Forward order
      for (let i = 0; i < players.length; i++) {
        const index = (winnerIndex + i) % players.length;
        order.push(players[index].id);
      }
    } else {
      // Reverse order
      for (let i = players.length - 1; i >= 0; i--) {
        const index = (winnerIndex + i) % players.length;
        order.push(players[index].id);
      }
    }
  }
  
  return order;
}

/**
 * Create activity log events for Fat Rando steals
 */
export function createFatRandoStealEvents(
  stolenGolferIds: string[],
  golfers: Golfer[]
): DraftEvent[] {
  return stolenGolferIds.map(golferId => {
    const golfer = golfers.find(g => g.id === golferId);
    return {
      type: 'steal',
      playerName: 'FAT RANDO',
      golferName: golfer?.name || 'Unknown',
      golferRank: golfer?.rank || 0,
      timestamp: new Date(),
    };
  });
}

/**
 * Get current draft state from localStorage
 */
export function getCurrentDraftState(tournamentId: string): DraftState | null {
  if (typeof window === 'undefined') return null;
  
  const key = `draft-${tournamentId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    if (parsed.activityLog) {
      parsed.activityLog = parsed.activityLog.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    }
    return parsed;
  } catch (e) {
    console.error('Error parsing draft state from localStorage:', e);
    return null;
  }
}

/**
 * Save draft state to localStorage
 */
export function saveDraftState(tournamentId: string, state: DraftState): void {
  if (typeof window === 'undefined') return;
  
  const key = `draft-${tournamentId}`;
  localStorage.setItem(key, JSON.stringify(state));
}

/**
 * Initialize a new draft state
 */
export function initializeDraftState(
  tournamentId: string,
  golfers: Golfer[],
  players: Player[]
): DraftState {
  // Generate Fat Rando steals
  const fatRandoStolenGolfers = generateFatRandoSteals(golfers);
  
  // Create activity log events for steals
  const stealEvents = createFatRandoStealEvents(fatRandoStolenGolfers, golfers);
  
  // Calculate draft order
  const draftOrder = calculateDraftOrder(players, tournamentId);
  
  return {
    tournamentId,
    fatRandoStolenGolfers,
    currentPick: 0,
    currentPlayerIndex: 0,
    draftOrder,
    picks: [],
    playerPicks: {},
    activityLog: stealEvents, // Start with Fat Rando steals
  };
}

/**
 * Check if draft is complete (all players have 4 picks: 3 active + 1 alternate)
 */
export function isDraftComplete(state: DraftState, players: Player[]): boolean {
  return players.every(player => {
    const picks = state.playerPicks[player.id];
    return picks && 
           picks.activeGolfers.length === 3 && 
           picks.alternateGolfer !== undefined;
  });
}

/**
 * Get the current player whose turn it is
 */
export function getCurrentPlayer(state: DraftState, players: Player[]): Player | null {
  if (state.currentPick >= state.draftOrder.length) {
    return null; // Draft is complete
  }
  
  const currentPlayerId = state.draftOrder[state.currentPick];
  return players.find(p => p.id === currentPlayerId) || null;
}

/**
 * Legacy: previously saved completed draft to localStorage.
 * Drafts now persist via API (saveCompletedDraftToApi). Kept for backward compat.
 */
export async function completeDraft(
  _tournamentId: string,
  _teamDrafts: TeamDraft[],
  _fatRandoStolenGolfers: string[]
): Promise<void> {
  // No-op: drafts persist via API
}
