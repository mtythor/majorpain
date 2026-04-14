import { Golfer, Player, DraftEvent, TeamDraft, Tournament, TournamentResult } from './types';
import { DraftState, DraftPick } from './draft-types';
import { getTournaments, getTournamentResult, getPlayers } from './data';

/** Minimum golfers required for Fat Rando steals (need 4 steals, ranges up to 1-20) */
const MIN_FIELD_FOR_RANDO_STEALS = 20;

/** First tournament of season: MtyThor → KristaKay → MrHattyhat → Atticus, then snake. */
const FIRST_TOURNAMENT_DRAFT_ORDER = ['1', '3', '4', '2'];

export interface FatRandoSteal {
  id: string;
  range: number;
}

/**
 * Generate Fat Rando steals using progressive random selection.
 * Steal #1: Random 1-5
 * Steal #2: Random 1-10 (from remaining)
 * Steal #3: Random 1-15 (from remaining)
 * Steal #4: Random 1-20 (from remaining)
 * Requires field to be set and sorted by OWGR rank (same order as draft table).
 * Returns each steal with the random range used, for transparent display.
 */
export function generateFatRandoSteals(golfers: Golfer[]): FatRandoSteal[] {
  if (!golfers || golfers.length < MIN_FIELD_FOR_RANDO_STEALS) {
    return [];
  }
  // Sort by OWGR rank ascending (same order as draft table: best/favorite first)
  const available = [...golfers].sort((a, b) => a.rank - b.rank);
  const stolen: FatRandoSteal[] = [];

  const ranges = [5, 10, 15, 20];
  for (const range of ranges) {
    const idx = Math.floor(Math.random() * Math.min(range, available.length));
    stolen.push({ id: available[idx].id, range });
    available.splice(idx, 1);
  }

  return stolen;
}

/**
 * Get finish order (1st, 2nd, 3rd, 4th) from the most recent completed tournament.
 * Returns undefined if no previous tournament with valid results.
 */
function getPreviousTournamentFinishOrder(currentTournamentId: string): string[] | undefined {
  const tournaments = getTournaments();
  const currentIndex = tournaments.findIndex(t => t.id === currentTournamentId);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const tournament = tournaments[i];
    const results = getTournamentResult(tournament.id);

    if (results && results.teamScores && results.teamScores.length > 0) {
      const sorted = [...results.teamScores].sort((a, b) => b.totalPoints - a.totalPoints);
      const order = sorted.map(s => s.playerId).filter(Boolean);
      if (order.length >= 4) return order;
      if (order.length > 0) return order;
    }
  }

  return undefined;
}

/**
 * Build snake draft order from a seed order [1st, 2nd, 3rd, 4th].
 */
function buildSnakeOrderFromSeed(seed: string[]): string[] {
  const order: string[] = [];
  const numPicks = 4;
  for (let round = 0; round < numPicks; round++) {
    if (round % 2 === 0) {
      seed.forEach(id => order.push(id));
    } else {
      for (let i = seed.length - 1; i >= 0; i--) order.push(seed[i]);
    }
  }
  return order;
}

/**
 * Get finish order (1st, 2nd, 3rd, 4th) from the most recent completed tournament.
 * Uses provided data (for server-side API). Returns undefined if no previous tournament with valid results.
 */
function getPreviousTournamentFinishOrderFromData(
  currentTournamentId: string,
  tournaments: { id: string }[],
  results: Record<string, TournamentResult | null | undefined>
): string[] | undefined {
  const currentIndex = tournaments.findIndex(t => t.id === currentTournamentId);
  for (let i = currentIndex - 1; i >= 0; i--) {
    const tournament = tournaments[i];
    const res = results[tournament.id];
    if (res && res.teamScores && res.teamScores.length > 0) {
      const sorted = [...res.teamScores].sort((a, b) => b.totalPoints - a.totalPoints);
      const order = sorted.map(s => s.playerId).filter(Boolean);
      if (order.length >= 4) return order;
      if (order.length > 0) return order;
    }
  }
  return undefined;
}

/**
 * Calculate draft order using provided data (for server-side API).
 * First tournament: MtyThor → KristaKay → MrHattyhat → Atticus, then snake.
 * Subsequent: Winner → 2nd → 3rd → 4th from previous tournament, then snake.
 */
export function calculateDraftOrderWithData(
  players: Player[],
  currentTournamentId: string,
  tournaments: { id: string }[],
  results: Record<string, TournamentResult | null | undefined>
): string[] {
  const finishOrder = getPreviousTournamentFinishOrderFromData(currentTournamentId, tournaments, results);
  if (!finishOrder || finishOrder.length === 0) {
    return getDefaultDraftOrder(players);
  }
  const seed = [...finishOrder];
  for (const p of players) {
    if (!seed.includes(p.id) && seed.length < 4) seed.push(p.id);
  }
  if (seed.length < 4) return getDefaultDraftOrder(players);
  return buildSnakeOrderFromSeed(seed.slice(0, 4));
}

/**
 * Default snake draft order when no previous winner exists (first tournament of season).
 * Uses fixed order: MtyThor → KristaKay → MrHattyhat → Atticus.
 * Used by server-side initiate-rando-steals (no access to data cache).
 */
export function getDefaultDraftOrder(players: Player[]): string[] {
  const order: string[] = [];
  const numPicks = 4; // 3 active + 1 alternate per player
  const baseOrder = FIRST_TOURNAMENT_DRAFT_ORDER.filter(id => players.some(p => p.id === id));
  const seed = baseOrder.length === 4 ? [...baseOrder] : players.map(p => p.id);
  for (let round = 0; round < numPicks; round++) {
    if (round % 2 === 0) {
      seed.forEach(id => order.push(id));
    } else {
      for (let i = seed.length - 1; i >= 0; i--) order.push(seed[i]);
    }
  }
  return order;
}

/**
 * Calculate snake draft order.
 * First tournament: MtyThor → KristaKay → MrHattyhat → Atticus, then snake.
 * Subsequent: Winner → 2nd → 3rd → 4th from previous tournament, then snake.
 */
export function calculateDraftOrder(players: Player[], currentTournamentId: string): string[] {
  const finishOrder = getPreviousTournamentFinishOrder(currentTournamentId);

  // No previous tournament (first of season): use fixed order
  if (!finishOrder || finishOrder.length === 0) {
    return getDefaultDraftOrder(players);
  }

  // Build seed: finish order + any missing players (pad to 4)
  const seed = [...finishOrder];
  for (const p of players) {
    if (!seed.includes(p.id) && seed.length < 4) seed.push(p.id);
  }
  if (seed.length < 4) return getDefaultDraftOrder(players);

  return buildSnakeOrderFromSeed(seed.slice(0, 4));
}

/**
 * Create activity log events for Fat Rando steals
 */
export function createFatRandoStealEvents(
  steals: FatRandoSteal[],
  golfers: Golfer[]
): DraftEvent[] {
  return steals.map(({ id, range }) => {
    const golfer = golfers.find(g => g.id === id);
    return {
      type: 'steal',
      playerName: 'FAT RANDO',
      golferName: golfer?.name || 'Unknown',
      golferRank: golfer?.rank || 0,
      stealRange: range,
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
  const steals = generateFatRandoSteals(golfers);
  const fatRandoStolenGolfers = steals.map(s => s.id);

  // Create activity log events for steals
  const stealEvents = createFatRandoStealEvents(steals, golfers);
  
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
