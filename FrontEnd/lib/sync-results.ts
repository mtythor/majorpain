/**
 * Core logic for syncing golfer results from RapidAPI leaderboard.
 * Used by cron and admin sync endpoints.
 */

import { getData, saveData } from './api-db';
import { mergeTournamentsWithSchedule } from './tournamentSchedule';
import { getTournamentState } from './tournament-utils';
import { fetchLeaderboard } from './live-golf-api';
import { mapLeaderboardToGolferResults } from './leaderboard-mapper';
import { calculateTeamScoresFromDrafts } from './dummyData';
import { sendSubstitutionReminderNotification } from './notifications';
import type { Tournament, TournamentResult } from './types';

export interface SyncResultsOptions {
  /** If true, fetch and map but do not save. Returns preview. */
  dryRun?: boolean;
  /** Limit to a single tournament ID (for admin single-tournament sync). */
  tournamentId?: string;
}

export interface SyncResultsResult {
  synced: string[];
  errors: string[];
  dryRunPreview?: Record<string, { golferResultsCount: number; teamScoresCount: number }>;
}

export async function syncResultsFromLiveApi(
  options: SyncResultsOptions = {}
): Promise<SyncResultsResult> {
  const { dryRun = false, tournamentId: singleTournamentId } = options;
  const synced: string[] = [];
  const errors: string[] = [];
  const dryRunPreview: Record<string, { golferResultsCount: number; teamScoresCount: number }> = {};

  const { data } = await getData();
  const tournaments = mergeTournamentsWithSchedule(
    data?.tournaments as Array<{ id: string; state?: string; fieldSource?: 'dummy' | 'live' }> | undefined
  ) as Tournament[];
  const results = (data?.results ?? {}) as Record<string, TournamentResult>;
  const golfers = (data?.golfers ?? {}) as Record<string, Array<{ id: string; name: string }>>;

  const toSync = tournaments.filter((t) => {
    if (singleTournamentId && t.id !== singleTournamentId) return false;
    const state = getTournamentState(t);
    if (state !== 'playing' && state !== 'completed') return false;
    if (t.fieldSource !== 'live') return false;
    const existing = results[t.id];
    if (!existing?.teamDrafts?.length) return false;
    return true;
  });

  let mergedData = { ...data } as {
    tournaments?: unknown[];
    players?: unknown[];
    golfers?: Record<string, unknown[]>;
    results?: Record<string, TournamentResult>;
    draftStates?: unknown;
  };

  for (const tournament of toSync) {
    try {
      const apiResponse = await fetchLeaderboard(tournament.id);
      const fieldGolfers = golfers[tournament.id] ?? [];
      const knownGolferIds = fieldGolfers.map((g) => g.id);
      const golferResults = mapLeaderboardToGolferResults(apiResponse as Record<string, unknown>, {
        tournament,
        knownGolferIds,
        fieldGolfers,
      });
      const existing = results[tournament.id];
      const teamDrafts = existing?.teamDrafts ?? [];
      const fatRandoStolenGolfers = existing?.fatRandoStolenGolfers ?? [];
      const teamScores = calculateTeamScoresFromDrafts(teamDrafts, golferResults);

      if (dryRun) {
        dryRunPreview[tournament.id] = {
          golferResultsCount: golferResults.length,
          teamScoresCount: teamScores.length,
        };
        synced.push(tournament.id);
        continue;
      }

      const newResults = {
        ...results,
        [tournament.id]: {
          tournamentId: tournament.id,
          teamDrafts,
          fatRandoStolenGolfers,
          golferResults,
          teamScores,
        },
      };
      mergedData = {
        ...mergedData,
        results: newResults,
      };
      synced.push(tournament.id);

      // After R2: notify eligible players who can make a voluntary substitution
      const afterR2 = golferResults.some((gr) => (gr.rounds?.length ?? 0) >= 2);
      const subWindowOpen = (() => {
        if (!tournament.startDate) return false;
        const cutoff = new Date(tournament.startDate + 'T00:00:00');
        cutoff.setDate(cutoff.getDate() + 2);
        cutoff.setHours(0, 0, 0, 0);
        return new Date() < cutoff;
      })();
      if (afterR2 && subWindowOpen) {
        const eligiblePlayerIds = (existing?.teamDrafts ?? [])
          .filter((draft) => {
            if (draft.playerId === '5') return false;
            if (draft.substitutions?.length) return false;
            const allActivesMadeCut = draft.activeGolfers.every((id) => {
              const gr = golferResults.find((r) => r.golferId === id);
              return gr?.madeCut === true;
            });
            if (!allActivesMadeCut) return false;
            const altResult = golferResults.find((r) => r.golferId === draft.alternateGolfer);
            return altResult?.madeCut === true;
          })
          .map((draft) => draft.playerId);
        if (eligiblePlayerIds.length > 0) {
          await sendSubstitutionReminderNotification(tournament.id, eligiblePlayerIds, tournament.name).catch(() => {});
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${tournament.id}: ${msg}`);
    }
  }

  if (!dryRun && synced.length > 0) {
    await saveData(mergedData as Parameters<typeof saveData>[0]);
  }

  return {
    synced,
    errors,
    ...(dryRun && Object.keys(dryRunPreview).length > 0 ? { dryRunPreview } : {}),
  };
}
