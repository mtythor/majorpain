import { Tournament, TournamentState } from './types';
import type { TournamentResult } from './types';

// Helper function to parse date from dateRange string
export function parseTournamentDate(dateRange: string): Date | null {
  // Format: "APR 09 - 12, 2026"
  const match = dateRange.match(/(\w{3})\s+(\d{1,2})\s+-\s+\d{1,2},\s+(\d{4})/);
  if (!match) return null;

  const monthMap: { [key: string]: number } = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  const month = monthMap[match[1]];
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month === undefined || isNaN(day) || isNaN(year)) return null;

  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Check if all golfers in results have complete rounds:
 * - Golfers who made cut: 4 rounds
 * - Golfers who missed cut: 2 rounds
 * Exported for event-triggered state changes (last round → completed).
 */
export function isResultsComplete(results: TournamentResult | null | undefined): boolean {
  if (!results?.golferResults?.length) return false;
  for (const gr of results.golferResults) {
    const expectedRounds = gr.madeCut ? 4 : 2;
    if (!gr.rounds || gr.rounds.length < expectedRounds) return false;
  }
  return true;
}

/**
 * Determine tournament state. Order: stored state > date-based.
 * - Stored (admin override or event-triggered): wins
 * - Date-based: derive from draftStart, start, end dates when no stored state
 */
export function getTournamentState(tournament: Tournament): TournamentState {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Stored state (admin override or event-triggered)
  if (tournament.state !== undefined && tournament.state !== null) {
    return tournament.state;
  }

  // Date-based fallback
  const startDate = tournament.startDate
    ? new Date(tournament.startDate)
    : parseTournamentDate(tournament.dateRange);

  const endDate = tournament.endDate
    ? new Date(tournament.endDate)
    : null;

  const draftStartDate = tournament.draftStartDate
    ? new Date(tournament.draftStartDate)
    : null;

  if (!startDate) return 'pre-draft';
  if (endDate && now > endDate) return 'completed';
  if (startDate && now >= startDate) return 'playing';
  if (draftStartDate && now >= draftStartDate) return 'draft';
  return 'pre-draft';
}

// Check if tournament is upcoming (not yet started)
export function isUpcomingTournament(tournament: Tournament): boolean {
  const state = getTournamentState(tournament);
  return state === 'pre-draft' || state === 'draft';
}
