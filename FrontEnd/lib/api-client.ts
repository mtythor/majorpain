/**
 * API Client: Fetches data from the backend API (database-backed routes).
 *
 * API_URL is the base path (e.g. /api for same-origin). All fetches go to API routes
 * which read from the database. JSON files in public/api/ are only used for seeding
 * (see scripts/export-dummy-data-to-json.ts and scripts/seed-from-json.ts).
 */

import type { Tournament, Golfer, Player, TournamentResult } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/** When true, drafts go to the backend. When false (USE_API_CLIENT=false), drafts use localStorage. */
export const USE_DRAFT_API = process.env.NEXT_PUBLIC_USE_API_CLIENT === 'true';

function getWriteSecret(): string {
  return (process.env.NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET || '').trim();
}

/**
 * Fetch all tournaments (from database via API)
 */
export async function fetchTournaments(): Promise<Tournament[]> {
  const response = await fetch(`${API_URL}/tournaments`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch a specific tournament by ID (from database via API)
 */
export async function fetchTournament(id: string): Promise<Tournament | null> {
  const response = await fetch(`${API_URL}/tournaments/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch tournament: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch golfers for a specific tournament (from database via API)
 */
export async function fetchGolfers(tournamentId: string): Promise<Golfer[]> {
  const response = await fetch(`${API_URL}/tournaments/${tournamentId}/golfers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch golfers: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch tournament results for a specific tournament (from database via API)
 */
export async function fetchTournamentResult(tournamentId: string): Promise<TournamentResult | null> {
  const response = await fetch(`${API_URL}/tournaments/${tournamentId}/results`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch tournament results: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch all players (from database via API)
 */
export async function fetchPlayers(): Promise<Player[]> {
  const response = await fetch(`${API_URL}/players`);
  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch current user (returns first player)
 */
export async function fetchCurrentUser(): Promise<Player> {
  const players = await fetchPlayers();
  return players[0];
}

/**
 * Get tournament data (tournament, golfers, results)
 */
export async function fetchTournamentData(tournamentId: string) {
  const [tournament, golfers, results] = await Promise.all([
    fetchTournament(tournamentId),
    fetchGolfers(tournamentId),
    fetchTournamentResult(tournamentId),
  ]);
  
  return {
    tournament: tournament || undefined,
    golfers,
    results,
  };
}

/**
 * Get current tournament (U.S. OPEN - Event 4)
 */
export async function fetchCurrentTournament(): Promise<Tournament | null> {
  const tournaments = await fetchTournaments();
  return tournaments.find(t => t.id === '4') || tournaments[0] || null;
}

/**
 * Get completed tournaments
 */
export async function fetchCompletedTournaments(): Promise<Tournament[]> {
  const tournaments = await fetchTournaments();
  return tournaments.filter(t => t.state === 'completed');
}

/**
 * Fetch draft state for a tournament (in-progress or completed)
 * Returns DraftState, or { teamDrafts, fatRandoStolenGolfers } if complete, or null
 */
export async function fetchDraftState(tournamentId: string): Promise<{
  draftState?: import('./draft-types').DraftState;
  teamDrafts?: import('./types').TeamDraft[];
  fatRandoStolenGolfers?: string[];
  updatedAt?: string;
} | null> {
  const res = await fetch(`${API_URL}/tournaments/${tournamentId}/draft`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

function buildSaveError(res: Response, json: { error?: string }, defaultMsg: string): Error {
  const msg = json.error || defaultMsg;
  if (res.status === 401) {
    return new Error(
      `${msg} (401). Check that NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET in .env.local matches MAJOR_PAIN_WRITE_SECRET on the server.`
    );
  }
  if (res.status === 409) {
    return new Error(`${msg} (409). The draft was updated elsewhere. Refresh and try again.`);
  }
  return new Error(res.status ? `${msg} (${res.status})` : msg);
}

/**
 * Save in-progress draft state to API
 */
export async function saveDraftStateToApi(
  tournamentId: string,
  state: import('./draft-types').DraftState
): Promise<{ ok: boolean; updatedAt?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = getWriteSecret();
  if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

  const res = await fetch(`${API_URL}/tournaments/${tournamentId}/draft-state`, {
    method: 'POST',
    headers,
    body: JSON.stringify(state),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw buildSaveError(res, json, 'Failed to save draft state');
  return json;
}

/**
 * Save completed draft to API
 */
export async function saveCompletedDraftToApi(
  tournamentId: string,
  teamDrafts: import('./types').TeamDraft[],
  fatRandoStolenGolfers: string[]
): Promise<{ ok: boolean }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = getWriteSecret();
  if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

  const res = await fetch(`${API_URL}/tournaments/${tournamentId}/draft`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ teamDrafts, fatRandoStolenGolfers }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw buildSaveError(res, json, 'Failed to save completed draft');
  return json;
}

/**
 * Get all tournament data (for season standings computation)
 */
export async function fetchAllTournamentData() {
  const tournaments = await fetchTournaments();
  
  const allData = await Promise.all(
    tournaments.map(async (tournament) => {
      const golfers = await fetchGolfers(tournament.id);
      const results = await fetchTournamentResult(tournament.id);
      return {
        tournament,
        golfers,
        results,
      };
    })
  );
  
  return allData;
}
