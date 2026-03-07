'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import BackgroundImage from '@/components/layout/BackgroundImage';
import TournamentPicker from '@/components/tournament/TournamentPicker';
import TournamentVenue from '@/components/tournament/TournamentVenue';
import PlayerCards from '@/components/tournament/PlayerCards';
import PreDraftBanner from '@/components/tournament/PreDraftBanner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  getCurrentUser,
  getTournament,
  getTournaments,
  getTournamentData,
  getPlayerCardsForTournament,
  getPlayers,
} from '@/lib/data';
import { useApiData, useTournamentData } from '@/lib/use-api-data';
import { getTournamentState, shouldShowPreDraftBanner } from '@/lib/tournament-view';
import { isUpcomingTournament } from '@/lib/tournament-utils';
import { fetchDraftState, USE_DRAFT_API } from '@/lib/api-client';
import { updateDataCache } from '@/lib/data';
import type { Tournament } from '@/lib/types';

export default function TournamentListView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { loading: loadingData, error: dataError } = useApiData();
  const { loading: loadingTournament, error: tournamentError } = useTournamentData(params.id);
  
  const tournaments = getTournaments();
  const tournament = getTournament(params.id) ?? tournaments[0];
  const { results } = getTournamentData(params.id);
  
  const playerCards = useMemo(
    () => getPlayerCardsForTournament(params.id),
    [params.id, results]
  );
  
  const [draftCompleteFromApi, setDraftCompleteFromApi] = useState<boolean | null>(null);

  // Redirect to draft page if tournament is in draft state AND no draft data exists yet
  useEffect(() => {
    if (!loadingData && !loadingTournament && tournament) {
      const { results } = getTournamentData(tournament.id);
      const tournamentState = getTournamentState(tournament);
      const players = getPlayers();
      
      // Check if draft data exists in results JSON
      const hasDraftDataInResults = results && results.teamDrafts && results.teamDrafts.length > 0;
      
      // Check if draft is complete in localStorage
      const hasAnyDraftData = hasDraftDataInResults;
      if (hasAnyDraftData) {
        setDraftCompleteFromApi(true);
        return;
      }
      if (tournamentState !== 'draft') return;

      // When USE_DRAFT_API and no draft data, check draft API - completed may be there
      if (USE_DRAFT_API) {
        setDraftCompleteFromApi(null);
        let cancelled = false;
        (async () => {
          try {
            const res = await fetchDraftState(tournament.id);
            if (cancelled) return;
            if (res?.teamDrafts?.length) {
              setDraftCompleteFromApi(true);
              updateDataCache(`results-${tournament.id}`, {
                ...(getTournamentData(tournament.id).results ?? {}),
                tournamentId: tournament.id,
                teamDrafts: res.teamDrafts,
                fatRandoStolenGolfers: res.fatRandoStolenGolfers ?? [],
                golferResults: [],
                teamScores: [],
              });
            } else {
              setDraftCompleteFromApi(false);
              router.push(`/draft?tournament=${tournament.id}`);
            }
          } catch {
            if (!cancelled) {
              setDraftCompleteFromApi(false);
              router.push(`/draft?tournament=${tournament.id}`);
            }
          }
        })();
        return () => { cancelled = true; };
      }
      router.push(`/draft?tournament=${tournament.id}`);
    }
  }, [loadingData, loadingTournament, tournament, router]);
  
  // Show loading state while data is being fetched
  if (loadingData || loadingTournament) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Loading tournament data...</div>
        </div>
      </ProtectedRoute>
    );
  }
  
  // Show error state if there's an error
  if (dataError || tournamentError) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Error loading data: {dataError?.message || tournamentError?.message}</div>
        </div>
      </ProtectedRoute>
    );
  }
  
  // Ensure we have a tournament before rendering
  if (!tournament) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Tournament not found</div>
        </div>
      </ProtectedRoute>
    );
  }
  
  // Get tournament data (results and playerCards already computed above via useMemo)
  const players = getPlayers();
  
  // Check if tournament is in draft state with no draft data - if so, show loading while redirecting
  const tournamentState = getTournamentState(tournament);
  
  const hasDraftDataInResults = results && results.teamDrafts && results.teamDrafts.length > 0;
  const hasAnyDraftData = hasDraftDataInResults;
  const isCheckingDraft = USE_DRAFT_API && tournamentState === 'draft' && !hasAnyDraftData && draftCompleteFromApi === null;
  
  if (tournamentState === 'draft' && !hasAnyDraftData && !isCheckingDraft) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Redirecting to draft...</div>
        </div>
      </ProtectedRoute>
    );
  }
  if (isCheckingDraft) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Checking draft status...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleViewChange = (view: import('@/lib/types').ViewMode) => {
    if (view === 'season') router.push('/season');
    else if (view === 'tournament') router.push(`/tournament/${params.id}/list`);
    else if (view === 'admin') router.push('/admin');
  };

  const handleViewModeChange = (mode: 'list' | 'table') => {
    if (mode === 'list') {
      router.push(`/tournament/${tournament.id}/list`);
    } else {
      router.push(`/tournament/${tournament.id}/table`);
    }
  };

  const handleTournamentSelect = (selectedTournament: Tournament) => {
    router.push(`/tournament/${selectedTournament.id}/list`);
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
        viewMode="list"
        userProfile={getCurrentUser()}
        onViewChange={handleViewChange}
        onViewModeChange={handleViewModeChange}
        showListTableToggle={!isUpcomingTournament(tournament)}
      />
      <TournamentPicker
        tournaments={tournaments}
        selectedTournament={tournament}
        onSelect={handleTournamentSelect}
        viewMode="list"
      />
      <div className="tournament-venue-desktop">
        <TournamentVenue tournament={tournament} viewMode="list" />
      </div>
      {shouldShowPreDraftBanner(tournamentState) ? (
        <div className="tournament-list-content">
          <PreDraftBanner />
        </div>
      ) : playerCards.length > 0 ? (
        <div className="tournament-list-content">
          <PlayerCards players={playerCards} position="relative" />
          {results && results.golferResults && results.golferResults.length > 0 &&
            results.golferResults.some((gr) => gr.rounds && gr.rounds.length > 0) && (
              <div
                className="tournament-list-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '8px',
                  paddingBottom: '24px',
                }}
              >
                <Link
                  href={`/tournament/${params.id}/results?view=list`}
                  style={{
                    fontFamily: 'var(--font-noto-sans), sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: 'normal',
                    color: '#3fa2ff',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  VIEW FULL LEADERBOARD
                </Link>
              </div>
            )}
        </div>
      ) : (
        <div className="tournament-list-content" style={{ padding: '40px', textAlign: 'center', color: '#ffffff', opacity: 0.9 }}>
          No draft results for this tournament. Seed test data in admin.
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
