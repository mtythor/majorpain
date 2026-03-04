'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BackgroundImage from '@/components/layout/BackgroundImage';
import { useIsMobile } from '@/hooks/useMediaQuery';
import SeasonTable from '@/components/season/SeasonTable';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  getCurrentUser,
  getSeasonStandings,
  getSeasonTournamentNames,
} from '@/lib/data';
import { useAllTournamentData } from '@/lib/use-api-data';

export default function SeasonPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { loading, error } = useAllTournamentData();

  const seasonStandings = useMemo(() => getSeasonStandings(), []);
  const tournamentNames = useMemo(() => getSeasonTournamentNames(), []);

  const handleViewChange = (view: import('@/lib/types').ViewMode) => {
    if (view === 'tournament') router.push('/tournament/1/list');
    else if (view === 'season') router.push('/season');
    else if (view === 'admin') router.push('/admin');
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Loading season data...</div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Error loading data: {error.message}</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
        }}
      >
        <BackgroundImage imageSrc="/images/Masters.jpg" alt="Background" />
        <Header
          currentView="season"
          userProfile={getCurrentUser()}
          onViewChange={handleViewChange}
        />
        <div
          className="season-content"
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: isMobile ? 'flex-start' : 'center',
            left: isMobile ? 0 : '50%',
            top: isMobile ? '121px' : '184px',
            transform: isMobile ? 'none' : 'translateX(-50%)',
            zIndex: 5,
            width: '100%',
            maxWidth: 'min(100%, var(--tournament-list-width))',
            padding: 0,
            boxSizing: 'border-box',
            overflowX: isMobile ? 'auto' : 'visible',
            overflowY: 'visible',
          }}
        >
          <SeasonTable
            players={seasonStandings}
            tournamentNames={tournamentNames}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
