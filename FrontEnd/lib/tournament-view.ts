/**
 * Centralized view logic for tournament state.
 * State drives what view to show; data drives what content to render inside it.
 */

import { getTournamentState as getState, parseTournamentDate } from './tournament-utils';
import type { Tournament, TournamentState } from './types';

export { getTournamentState, parseTournamentDate } from './tournament-utils';

/** Re-export for convenience */
export function getTournamentView(tournament: Tournament): TournamentState {
  return getState(tournament);
}

/** True only when state is pre-draft. Use for PreDraftBanner visibility. */
export function shouldShowPreDraftBanner(state: TournamentState): boolean {
  return state === 'pre-draft';
}

/** For draft page: redirect to list when tournament is playing or completed. */
export function shouldRedirectToList(state: TournamentState): boolean {
  return state === 'playing' || state === 'completed';
}

/** For list/table pages: redirect to draft when in draft state and no draft data exists. */
export function shouldRedirectToDraft(state: TournamentState, hasDraftData: boolean): boolean {
  return state === 'draft' && !hasDraftData;
}
