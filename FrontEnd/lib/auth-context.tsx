'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Tournament } from './types';
import { parseTournamentDate, getTournamentState } from './tournament-view';
import { getTournaments } from './data';
import { useApiData } from './use-api-data';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Find the currently playing tournament (there should only ever be one)
function findCurrentPlayingTournament(tournaments: Tournament[]): Tournament | null {
  const playing = tournaments.find((t) => getTournamentState(t) === 'playing');
  return playing ?? null;
}

// Find the tournament that comes next after the last completed one
function findNextTournamentAfterLastCompleted(tournaments: Tournament[]): Tournament | null {
  const withDates = tournaments
    .map((t) => ({
      tournament: t,
      startDate: t.startDate ? new Date(t.startDate) : parseTournamentDate(t.dateRange),
    }))
    .filter(({ startDate }) => startDate)
    .sort((a, b) => (a.startDate!.getTime() - b.startDate!.getTime()));

  if (withDates.length === 0) return null;

  let lastCompletedIndex = -1;
  for (let i = withDates.length - 1; i >= 0; i--) {
    if (getTournamentState(withDates[i].tournament) === 'completed') {
      lastCompletedIndex = i;
      break;
    }
  }

  const nextIndex = lastCompletedIndex + 1;
  return nextIndex < withDates.length ? withDates[nextIndex].tournament : null;
}

/** Path to land on after login or when visiting / while authenticated */
export function getLandingPath(): string {
  const tournaments = getTournaments();
  const target =
    findCurrentPlayingTournament(tournaments) ??
    findNextTournamentAfterLastCompleted(tournaments);
  if (!target) return '/season';
  // Always land on list page - it will redirect to draft if tournament is in draft state.
  // This ensures data is loaded before draft page, avoiding flicker from cache race.
  return `/tournament/${target.id}/list`;
}

/** Background image for the landing page (used on login to preview destination) */
export function getLandingBackgroundImage(): string {
  const tournaments = getTournaments();
  const target =
    findCurrentPlayingTournament(tournaments) ??
    findNextTournamentAfterLastCompleted(tournaments);
  return target?.backgroundImage ?? '/images/Masters.jpg';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  useApiData(); // Ensure tournaments/players are loaded for login redirect

  useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');

    router.push(getLandingPath());
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
