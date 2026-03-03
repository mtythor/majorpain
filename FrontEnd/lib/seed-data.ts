/**
 * Seed data for populating the database with mock data.
 * Used by the admin seed API and optionally by the CLI seed script.
 */

import type { Golfer, TournamentResult } from './types';
import type { MajorPainData } from './api-db';
import {
  dummyTournaments,
  dummyPlayers,
  dummyGolfers,
  dummyTournamentResults,
  generatePartialResults,
  generateTournamentResult,
  isRyderCup,
} from './dummyData';

export type SeedMode = 0 | 1 | 2 | 3 | 4 | 'golfers' | 'full';

/**
 * Build the full mock state payload for seeding the database.
 * Replaces the entire major_pain_state with fresh mock data.
 */
export function getSeedData(): MajorPainData {
  const results: Record<string, unknown> = {};
  for (const [tournamentId, result] of Object.entries(dummyTournamentResults)) {
    if (result != null) {
      results[tournamentId] = result;
    }
  }

  return {
    tournaments: dummyTournaments,
    players: dummyPlayers,
    golfers: dummyGolfers,
    results,
    draftStates: {},
  };
}

/** Existing result from DB (teamDrafts, fatRandoStolenGolfers) - used when seeding scores after a real draft */
export interface ExistingTournamentResult {
  teamDrafts?: Array<{ playerId: string; activeGolfers: string[]; alternateGolfer?: string }>;
  fatRandoStolenGolfers?: string[];
}

/**
 * Get seed data for a single tournament (golfers and optional results).
 * mode: 0|'golfers' = golfers only, no results (for draft testing)
 *       1|2|3|4 = partial results through that round (cut applied after R2 when applicable)
 *       'full' = golfers (if missing) + complete 4-round results
 * Uses existing teamDrafts/fatRandoStolenGolfers when provided (e.g. after real draft).
 * Ryder Cup (id 9): only 'full' is supported; round-by-round uses full result.
 */
export function getSeedDataForTournament(
  tournamentId: string,
  mode: SeedMode = 1,
  existingGolfers?: Golfer[],
  existingResult?: ExistingTournamentResult
): {
  golfers: Golfer[];
  results: TournamentResult | null;
} {
  const golfers = existingGolfers ?? dummyGolfers[tournamentId] ?? [];
  let results: TournamentResult | null = null;

  if (mode === 0 || mode === 'golfers') {
    return { golfers, results: null };
  }

  if (isRyderCup(tournamentId)) {
    results = generateTournamentResult(tournamentId, golfers, true, existingResult);
  } else if (mode === 'full') {
    results = generateTournamentResult(tournamentId, golfers, true, existingResult);
  } else if (mode >= 1 && mode <= 4) {
    results = generatePartialResults(tournamentId, golfers, mode as 1 | 2 | 3 | 4, existingResult);
  }

  return { golfers, results };
}
