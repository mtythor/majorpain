import { Tournament, TournamentState } from './types';

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

// Determine tournament state based on dates
export function getTournamentState(tournament: Tournament): TournamentState {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // If tournament has explicit state, use it (check for undefined/null explicitly)
  if (tournament.state !== undefined && tournament.state !== null) {
    return tournament.state;
  }

  // Parse dates
  const startDate = tournament.startDate 
    ? new Date(tournament.startDate)
    : parseTournamentDate(tournament.dateRange);
  
  const endDate = tournament.endDate 
    ? new Date(tournament.endDate)
    : null;
  
  const draftStartDate = tournament.draftStartDate
    ? new Date(tournament.draftStartDate)
    : null;

  // If we can't parse dates, default to pre-draft
  if (!startDate) {
    return 'pre-draft';
  }

  // Check if tournament has ended (must check first)
  if (endDate && now > endDate) {
    return 'completed';
  }

  // Check if tournament is currently playing
  if (startDate && now >= startDate) {
    return 'playing';
  }

  // Check if draft has started (only if tournament hasn't started yet)
  if (draftStartDate && now >= draftStartDate) {
    return 'draft';
  }

  // Tournament is in the future and draft hasn't started
  return 'pre-draft';
}

// Check if tournament is upcoming (not yet started)
export function isUpcomingTournament(tournament: Tournament): boolean {
  const state = getTournamentState(tournament);
  return state === 'pre-draft' || state === 'draft';
}
