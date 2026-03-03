'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import BackgroundImage from '@/components/layout/BackgroundImage';
import MainContainer from '@/components/layout/MainContainer';
import TournamentPicker from '@/components/tournament/TournamentPicker';
import PreDraftBanner from '@/components/tournament/PreDraftBanner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Player, Tournament, TournamentState } from '@/lib/types';
import { getTournamentState } from '@/lib/tournament-utils';

// Mock data
const mockUser: Player = {
  id: '1',
  name: 'MtyThor',
  imageUrl: '/images/Player_MtyThor.jpg',
};

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'THE OPEN CHAMPIONSHIP',
    dateRange: 'APR 09 - 12, 2026',
    backgroundImage: '/images/Masters.jpg',
  },
];

export default function TournamentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const tournament = mockTournaments.find((t) => t.id === params.id) || mockTournaments[0];
  const calculatedState = getTournamentState(tournament);
  const [overrideState, setOverrideState] = useState<TournamentState | null>(null);
  const tournamentState = overrideState || calculatedState;

  const handleViewChange = (view: import('@/lib/types').ViewMode) => {
    if (view === 'season') router.push('/season');
    else if (view === 'tournament') router.push(`/tournament/${params.id}/list`);
    else if (view === 'admin') router.push('/admin');
  };

  const handleViewModeChange = (mode: 'list' | 'table') => {
    if (mode === 'list') {
      router.push(`/tournament/${params.id}/list`);
    } else {
      router.push(`/tournament/${params.id}/table`);
    }
  };

  return (
    <ProtectedRoute>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          width: '100%',
          minHeight: '100vh',
          zIndex: 1,
        }}
      >
        <BackgroundImage imageSrc={tournament.backgroundImage} alt={tournament.name} />
        <Header
          currentView="tournament"
          viewMode="table"
          userProfile={mockUser}
          onViewChange={handleViewChange}
          onViewModeChange={handleViewModeChange}
        />
        <MainContainer>
          <TournamentPicker
            tournaments={mockTournaments}
            selectedTournament={tournament}
            onSelect={(t) => router.push(`/tournament/${t.id}`)}
          />
          {tournamentState === 'pre-draft' && (
            <div style={{ padding: '40px', width: '100%' }}>
              <PreDraftBanner />
            </div>
          )}
          {tournamentState !== 'pre-draft' && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Tournament Details</h2>
              <p>Tournament view content goes here</p>
            </div>
          )}
        </MainContainer>
        {/* Temporary state control */}
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          backgroundColor: '#262626',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid #fdc71c',
          zIndex: 9999,
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)',
        }}>
          <label style={{ color: '#ffffff', marginRight: '8px', fontFamily: "'Open Sans', sans-serif", fontSize: '14px' }}>
            State:
          </label>
          <select
            value={tournamentState}
            onChange={(e) => setOverrideState(e.target.value as TournamentState)}
            style={{
              backgroundColor: '#141414',
              color: '#ffffff',
              border: '1px solid #707070',
              borderRadius: '4px',
              padding: '4px 8px',
              fontFamily: "'Open Sans', sans-serif",
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <option value="pre-draft">Pre-Draft</option>
            <option value="draft">Draft</option>
            <option value="playing">Playing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </ProtectedRoute>
  );
}
