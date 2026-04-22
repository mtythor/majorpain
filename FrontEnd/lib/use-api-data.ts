/**
 * React hook to load API data into cache.
 * Always fetches from API (backend: Postgres or JSON file when DATABASE_URL not set).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { updateDataCache } from './data';
import {
  fetchTournaments,
  fetchPlayers,
  fetchGolfers,
  fetchTournamentResult,
} from './api-client';

export function useApiData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Load core data and update cache
        const [tournaments, players] = await Promise.all([
          fetchTournaments(),
          fetchPlayers(),
        ]);
        
        updateDataCache('tournaments', tournaments);
        updateDataCache('players', players);
        // currentUser is set by auth-context based on logged-in user
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { loading, error };
}

const DEFAULT_POLL_INTERVAL_MS = 60_000;

export function useTournamentData(
  tournamentId: string,
  options?: { pollInterval?: number }
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pollInterval = options?.pollInterval ?? DEFAULT_POLL_INTERVAL_MS;

  const refetch = useRefCallback(async () => {
    if (!tournamentId) return;
    try {
      const [golfers, results] = await Promise.all([
        fetchGolfers(tournamentId),
        fetchTournamentResult(tournamentId),
      ]);
      updateDataCache(`golfers-${tournamentId}`, golfers);
      updateDataCache(`results-${tournamentId}`, results);
      setRefreshTrigger((t) => t + 1); // cause re-render so UI shows fresh data
    } catch (err) {
      console.warn('Failed to refresh tournament data:', err);
    }
  });

  useEffect(() => {
    if (!tournamentId) return;

    async function loadTournamentData() {
      try {
        setLoading(true);
        setError(null);

        const [golfers, results] = await Promise.all([
          fetchGolfers(tournamentId),
          fetchTournamentResult(tournamentId),
        ]);

        updateDataCache(`golfers-${tournamentId}`, golfers);
        updateDataCache(`results-${tournamentId}`, results);

        setRefreshTrigger((t) => t + 1);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load tournament data'));
        setLoading(false);
      }
    }

    loadTournamentData();
  }, [tournamentId]);

  // Poll + visibility/focus refresh for live results
  useEffect(() => {
    if (!tournamentId || pollInterval <= 0) return;

    const id = setInterval(refetch, pollInterval);
    const onFocus = () => refetch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tournamentId, pollInterval, refetch]);

  return { loading, error, refreshTrigger };
}

function useRefCallback<T extends (...args: unknown[]) => unknown>(cb: T): T {
  const ref = useRef(cb);
  ref.current = cb;
  return useCallback(
    ((...args: unknown[]) => ref.current(...args)) as T,
    []
  );
}

export function useAllTournamentData(options?: { pollInterval?: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pollInterval = options?.pollInterval ?? DEFAULT_POLL_INTERVAL_MS;

  const refetch = useRefCallback(async () => {
    try {
      const [tournaments, players] = await Promise.all([
        fetchTournaments(),
        fetchPlayers(),
      ]);
      updateDataCache('tournaments', tournaments);
      updateDataCache('players', players);

      await Promise.all(
        tournaments.map(async (tournament) => {
          try {
            const [golfers, results] = await Promise.all([
              fetchGolfers(tournament.id),
              fetchTournamentResult(tournament.id),
            ]);
            updateDataCache(`golfers-${tournament.id}`, golfers);
            updateDataCache(`results-${tournament.id}`, results);
          } catch (err) {
            console.warn(`Failed to load data for tournament ${tournament.id}:`, err);
          }
        })
      );
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.warn('Failed to refresh season data:', err);
    }
  });

  useEffect(() => {
    async function loadAllTournamentData() {
      try {
        setLoading(true);
        setError(null);

        const [tournaments, players] = await Promise.all([
          fetchTournaments(),
          fetchPlayers(),
        ]);

        updateDataCache('tournaments', tournaments);
        updateDataCache('players', players);

        const tournamentDataPromises = tournaments.map(async (tournament) => {
          try {
            const [golfers, results] = await Promise.all([
              fetchGolfers(tournament.id),
              fetchTournamentResult(tournament.id),
            ]);

            updateDataCache(`golfers-${tournament.id}`, golfers);
            updateDataCache(`results-${tournament.id}`, results);
          } catch (err) {
            console.warn(`Failed to load data for tournament ${tournament.id}:`, err);
          }
        });

        await Promise.all(tournamentDataPromises);

        setRefreshTrigger((t) => t + 1);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load tournament data'));
        setLoading(false);
      }
    }

    loadAllTournamentData();
  }, []);

  // Poll + visibility/focus refresh for live season standings
  useEffect(() => {
    if (pollInterval <= 0) return;

    const id = setInterval(refetch, pollInterval);
    const onFocus = () => refetch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pollInterval, refetch]);

  return { loading, error, refreshTrigger };
}
