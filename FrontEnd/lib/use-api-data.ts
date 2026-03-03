/**
 * React hook to load API data into cache for use with sync data functions
 * 
 * When NEXT_PUBLIC_USE_API_CLIENT is true, this hook fetches data and populates
 * the cache so that sync functions in data.ts can access it.
 * 
 * When NEXT_PUBLIC_USE_API_CLIENT is false, this hook does nothing (dummy data is used).
 */

import { useEffect, useState } from 'react';
import { updateDataCache } from './data';
import {
  fetchTournaments,
  fetchPlayers,
  fetchGolfers,
  fetchTournamentResult,
} from './api-client';

const USE_API_CLIENT = process.env.NEXT_PUBLIC_USE_API_CLIENT === 'true';

export function useApiData() {
  const [loading, setLoading] = useState(USE_API_CLIENT);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!USE_API_CLIENT) {
      setLoading(false);
      return;
    }

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
        updateDataCache('currentUser', players[0]);
        
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

export function useTournamentData(tournamentId: string) {
  const [loading, setLoading] = useState(USE_API_CLIENT);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!USE_API_CLIENT) {
      setLoading(false);
      return;
    }

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
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load tournament data'));
        setLoading(false);
      }
    }

    loadTournamentData();
  }, [tournamentId]);

  return { loading, error };
}

export function useAllTournamentData() {
  const [loading, setLoading] = useState(USE_API_CLIENT);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!USE_API_CLIENT) {
      setLoading(false);
      return;
    }

    async function loadAllTournamentData() {
      try {
        setLoading(true);
        setError(null);
        
        // First load tournaments and players
        const [tournaments, players] = await Promise.all([
          fetchTournaments(),
          fetchPlayers(),
        ]);
        
        updateDataCache('tournaments', tournaments);
        updateDataCache('players', players);
        updateDataCache('currentUser', players[0]);
        
        // Then load data for all completed tournaments
        const completedTournaments = tournaments.filter(t => t.state === 'completed');
        const tournamentDataPromises = completedTournaments.map(async (tournament) => {
          try {
            const [golfers, results] = await Promise.all([
              fetchGolfers(tournament.id),
              fetchTournamentResult(tournament.id),
            ]);
            
            updateDataCache(`golfers-${tournament.id}`, golfers);
            updateDataCache(`results-${tournament.id}`, results);
          } catch (err) {
            // If a tournament fails to load, continue with others
            console.warn(`Failed to load data for tournament ${tournament.id}:`, err);
          }
        });
        
        await Promise.all(tournamentDataPromises);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load tournament data'));
        setLoading(false);
      }
    }

    loadAllTournamentData();
  }, []);

  return { loading, error };
}
