'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import OneSignal from 'react-onesignal';
import { onesignalInit, tryOneSignalLogin } from './onesignal-init';
import { Tournament } from './types';
import { parseTournamentDate, getTournamentState } from './tournament-view';
import { getTournaments, updateDataCache, getPlayers } from './data';
import { useApiData } from './use-api-data';
import { dummyPlayers } from './dummyData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const TOKEN_KEY = 'major_pain_token';

export interface CurrentUser {
  playerId: number;
  playerName: string;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  forcePasswordChange: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  loading: boolean;
  login: (user: CurrentUser, token: string) => void;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  clearForcePasswordChange: () => void;
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useApiData();

  const refreshCurrentUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('major_pain_authenticated');
        setCurrentUser(null);
        return;
      }
      if (!res.ok) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      const user: CurrentUser = {
        playerId: data.playerId,
        playerName: data.playerName,
        username: data.username,
        isAdmin: data.isAdmin,
        isSuperAdmin: data.isSuperAdmin,
        forcePasswordChange: data.forcePasswordChange ?? false,
      };
      setCurrentUser(user);
      // Sync currentUser to data cache for getCurrentUser()
      const players = getPlayers().length ? getPlayers() : dummyPlayers;
      const player = players.find((p) => p.id === String(user.playerId));
      if (player) {
        updateDataCache('currentUser', player);
      }
      // Set OneSignal external ID for push targeting (only when subscribed - else 400)
      tryOneSignalLogin(user.playerId);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    refreshCurrentUser().finally(() => setLoading(false));
  }, [refreshCurrentUser]);

  // Sync OneSignal external ID when user is logged in, OneSignal ready, AND user has subscribed
  // (login without subscription causes 400; poll until we have subscription, failed, or 2min timeout)
  useEffect(() => {
    if (!currentUser) return;
    const start = Date.now();
    const POLL_MS = 500;
    const MAX_POLL_MS = 120000; // 2 min - notifications page will call tryOneSignalLogin on subscribe
    const interval = setInterval(() => {
      if (Date.now() - start >= MAX_POLL_MS) {
        clearInterval(interval);
        return;
      }
      if (onesignalInit.status === 'ready') {
        tryOneSignalLogin(currentUser.playerId);
        const sub = OneSignal.User?.PushSubscription;
        if (sub?.optedIn && sub?.id) clearInterval(interval);
      } else if (onesignalInit.status === 'failed' || onesignalInit.status === 'unavailable') {
        clearInterval(interval);
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [currentUser?.playerId]);

  const login = useCallback((user: CurrentUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('major_pain_authenticated', 'true');
    setCurrentUser(user);
    const players = getPlayers().length ? getPlayers() : dummyPlayers;
    const player = players.find((p) => p.id === String(user.playerId));
    if (player) {
      updateDataCache('currentUser', player);
    }
    // Set OneSignal external ID for push targeting (only when subscribed - else 400)
    if (typeof window !== 'undefined') tryOneSignalLogin(user.playerId);
    router.push(getLandingPath());
  }, [router]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      OneSignal.logout().catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('major_pain_authenticated');
    setCurrentUser(null);
    updateDataCache('currentUser', undefined);
    router.push('/login');
  }, [router]);

  const clearForcePasswordChange = useCallback(() => {
    setCurrentUser((u) => (u ? { ...u, forcePasswordChange: false } : null));
  }, []);

  const isAuthenticated = currentUser !== null;
  const showForcePasswordChange = isAuthenticated && currentUser?.forcePasswordChange === true;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        loading,
        login,
        logout,
        refreshCurrentUser,
        clearForcePasswordChange,
      }}
    >
      {showForcePasswordChange ? (
        <ForcePasswordChangeOverlay onSuccess={clearForcePasswordChange} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

/** Full-screen overlay when user must change password before accessing the app */
function ForcePasswordChangeOverlay({ onSuccess }: { onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '/api') : '/api';
  const TOKEN_KEY = 'major_pain_token';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      if (!token) {
        setError('Session expired');
        setSubmitting(false);
        return;
      }
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to change password');
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch {
      setError('Failed to change password');
    }
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: '#262626',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
        }}
      >
      <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
        You must change your password
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={submitting}
          style={{
            padding: '12px',
            backgroundColor: '#141414',
            border: 'none',
            color: '#fff',
            borderRadius: '4px',
          }}
        />
        <input
          type="password"
          placeholder="New password (min 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          disabled={submitting}
          style={{
            padding: '12px',
            backgroundColor: '#141414',
            border: 'none',
            color: '#fff',
            borderRadius: '4px',
          }}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={submitting}
          style={{
            padding: '12px',
            backgroundColor: '#141414',
            border: 'none',
            color: '#fff',
            borderRadius: '4px',
          }}
        />
        {error && <div style={{ color: '#ff6b6b', fontSize: '14px' }}>{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px',
            backgroundColor: '#ffc61c',
            border: 'none',
            color: '#000',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {submitting ? 'Saving...' : 'Change password'}
        </button>
      </form>
      </div>
    </div>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
