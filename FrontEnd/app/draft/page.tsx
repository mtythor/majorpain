'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import BackgroundImage from '@/components/layout/BackgroundImage';
import MainContainer from '@/components/layout/MainContainer';
import TournamentPicker from '@/components/tournament/TournamentPicker';
import TournamentVenue from '@/components/tournament/TournamentVenue';
import DraftBanner from '@/components/tournament/DraftBanner';
import PreDraftBanner from '@/components/tournament/PreDraftBanner';
import DraftTable from '@/components/draft/DraftTable';
import PlayByPlay from '@/components/tournament/PlayByPlay';
import ConfirmationModal from '@/components/modal/ConfirmationModal';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Golfer, Tournament, Player, DraftStatus, DraftEvent, TournamentState } from '@/lib/types';
import {
  getTournaments,
  getGolfers,
  getTournamentData,
  getCurrentTournament,
  getPlayers,
  getCurrentUser,
} from '@/lib/data';
import { getTournamentState } from '@/lib/tournament-view';
import {
  getCurrentDraftState,
  saveDraftState,
  initializeDraftState,
  isDraftComplete,
  getCurrentPlayer,
} from '@/lib/draft-logic';
import {
  fetchDraftState,
  saveDraftStateToApi,
  saveCompletedDraftToApi,
  getDraftStreamUrl,
  USE_DRAFT_API,
} from '@/lib/api-client';
import { useApiData, useTournamentData } from '@/lib/use-api-data';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DraftState } from '@/lib/draft-types';

const mockUser: Player = getCurrentUser();
const DRAFT_SELECTED_TOURNAMENT_KEY = 'draft-selected-tournament-id';

function getInitialSelectedTournament(tournamentIdFromUrl?: string | null): Tournament | undefined {
  if (typeof window === 'undefined') return getCurrentTournament();
  // URL param takes precedence (e.g. from admin "Open draft" link)
  if (tournamentIdFromUrl) {
    const t = getTournaments().find(tournament => tournament.id === tournamentIdFromUrl);
    if (t) return t;
  }
  const savedId = sessionStorage.getItem(DRAFT_SELECTED_TOURNAMENT_KEY);
  if (savedId) {
    const t = getTournaments().find(tournament => tournament.id === savedId);
    if (t) return t;
  }
  return getCurrentTournament();
}

// Helper function to get player imageUrl
function getPlayerImageUrl(playerId: string, players: Player[]): string {
  const player = players.find(p => p.id === playerId);
  return player?.imageUrl || '';
}

function DraftPageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      Loading...
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={<DraftPageSkeleton />}>
      <DraftPageContent />
    </Suspense>
  );
}

function DraftPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentIdFromUrl = searchParams.get('tournament');
  const isMobile = useIsMobile();
  const { loading: apiLoading } = useApiData();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | undefined>(undefined);
  useTournamentData(selectedTournament?.id ?? '');
  const tournamentData = selectedTournament ? getTournamentData(selectedTournament.id) : { results: null };
  const tournamentState = selectedTournament ? getTournamentState(selectedTournament) : 'pre-draft';

  // Persist selected tournament so back navigation shows the correct draft
  useEffect(() => {
    if (selectedTournament && typeof window !== 'undefined') {
      sessionStorage.setItem(DRAFT_SELECTED_TOURNAMENT_KEY, selectedTournament.id);
    }
  }, [selectedTournament?.id]);

  // Set selected tournament when we have it in cache. When arriving with ?tournament=X from list
  // redirect, the cache is already populated - set immediately. Don't wait for draft's useApiData
  // to complete, which would cause a second fetch and potential flicker when cache overwrites.
  useEffect(() => {
    if (selectedTournament) return;
    const current = getInitialSelectedTournament(tournamentIdFromUrl);
    if (current) setSelectedTournament(current);
  }, [selectedTournament, tournamentIdFromUrl]);
  const golfers = selectedTournament ? getGolfers(selectedTournament.id) : [];
  const players = getPlayers();
  
  // Initialize draft state management
  const [internalDraftState, setInternalDraftState] = useState<DraftState | null>(() => {
    if (USE_DRAFT_API) return null; // Load async from API
    if (!selectedTournament || tournamentState !== 'draft') return null;
    const saved = getCurrentDraftState(selectedTournament.id);
    if (saved) return saved;
    return initializeDraftState(selectedTournament.id, golfers, players);
  });
  const [draftLoading, setDraftLoading] = useState(USE_DRAFT_API);
  const [completingDraft, setCompletingDraft] = useState(false);
  const [completingDraftError, setCompletingDraftError] = useState<string | null>(null);
  const pendingCompletionRef = useRef<{ teamDrafts: import('@/lib/types').TeamDraft[]; fatRandoStolenGolfers: string[] } | null>(null);
  const lastKnownUpdatedAtRef = useRef<string | null>(null);
  const lastSaveCompletedAtRef = useRef<number>(0);
  const saveInProgressRef = useRef(false);
  const skipSaveFromPollRef = useRef(false);
  const lastLoadAtRef = useRef<number>(0);
  
  // Convert DraftState to DraftStatus map for UI
  const [draftState, setDraftState] = useState<Record<string, DraftStatus>>(() => {
    const state: Record<string, DraftStatus> = {};
    
    if (tournamentState === 'completed' && tournamentData.results) {
      // For completed tournaments, show final draft selections
      tournamentData.results.teamDrafts.forEach((draft) => {
        draft.activeGolfers.forEach((golferId) => {
          const player = players.find(p => p.id === draft.playerId);
          if (player) {
            state[golferId] = {
              golferId,
              draftedBy: player.name,
              draftedByImage: player.imageUrl,
              isSelectable: false,
            };
          }
        });
        // Also mark alternate
        const player = players.find(p => p.id === draft.playerId);
        if (player) {
          state[draft.alternateGolfer] = {
            golferId: draft.alternateGolfer,
            draftedBy: player.name,
            draftedByImage: player.imageUrl,
            isSelectable: false,
          };
        }
      });
    } else if (tournamentState === 'draft' && internalDraftState) {
      // For draft state, mark golfers based on internal draft state
      golfers.forEach((golfer) => {
        const isStolen = internalDraftState.fatRandoStolenGolfers.includes(golfer.id);
        const pick = internalDraftState.picks.find(p => p.golferId === golfer.id);
        
        if (isStolen) {
          state[golfer.id] = {
            golferId: golfer.id,
            draftedBy: 'Fat Rando',
            draftedByImage: '/images/Player_FatRando.jpg',
            isSelectable: false,
          };
        } else if (pick) {
          const player = players.find(p => p.id === pick.playerId);
          const imageUrl = getPlayerImageUrl(pick.playerId, players);
          state[golfer.id] = {
            golferId: golfer.id,
            draftedBy: player?.name || 'Unknown',
            draftedByImage: imageUrl,
            isSelectable: false,
          };
        } else {
          state[golfer.id] = {
            golferId: golfer.id,
            isSelectable: true,
          };
        }
      });
    } else if (tournamentState === 'draft') {
      // Fallback: initialize empty
      golfers.forEach((golfer) => {
        state[golfer.id] = {
          golferId: golfer.id,
          isSelectable: true,
        };
      });
    }
    
    return state;
  });

  // Initialize play-by-play events from internal draft state or completed tournament
  const [playByPlayEvents, setPlayByPlayEvents] = useState<DraftEvent[]>(() => {
    if (tournamentState === 'completed' && tournamentData.results) {
      // Generate play-by-play from completed tournament
      const events: DraftEvent[] = [];
      
      // Add Fat Rando steals
      tournamentData.results.fatRandoStolenGolfers.forEach((golferId) => {
        const golfer = golfers.find(g => g.id === golferId);
        if (golfer) {
          events.push({
            type: 'steal',
            playerName: 'FAT RANDO',
            golferName: golfer.name,
            golferRank: golfer.rank,
            timestamp: new Date(),
          });
        }
      });
      
      // Add team selections
      tournamentData.results.teamDrafts.forEach((draft) => {
        const player = players.find(p => p.id === draft.playerId);
        if (player) {
          draft.activeGolfers.forEach((golferId) => {
            const golfer = golfers.find(g => g.id === golferId);
            if (golfer) {
              events.push({
                type: 'select',
                playerName: player.name.toUpperCase(),
                golferName: golfer.name,
                golferRank: golfer.rank,
                timestamp: new Date(),
              });
            }
          });
        }
      });
      
      return events;
    } else if (tournamentState === 'draft' && internalDraftState) {
      // Use activity log from internal draft state
      return internalDraftState.activityLog;
    }
    return [];
  });

  const [selectedGolferId, setSelectedGolferId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Manual testing mode: allow selecting which player is making the pick
  const [manualTestPlayerId, setManualTestPlayerId] = useState<string | null>(null);

  // Update state when tournament changes
  useEffect(() => {
    if (!selectedTournament) return;
    
    const newData = getTournamentData(selectedTournament.id);
    const newState = getTournamentState(selectedTournament);
    const newGolfers = getGolfers(selectedTournament.id);
    
    // Check if draft is complete in results JSON
    const hasDraftDataInResults = newData.results && newData.results.teamDrafts && newData.results.teamDrafts.length > 0;
    
    // If draft is complete in API results, redirect to list page
    if (newState === 'draft' && hasDraftDataInResults) {
      router.push(`/tournament/${selectedTournament.id}/list`);
      return;
    }
    
    // Reset draft state
    const newDraftState: Record<string, DraftStatus> = {};
    let newInternalDraftState: DraftState | null = null;
    
    if (newState === 'completed' && newData.results) {
      // For completed tournaments, show final draft selections
      newData.results.teamDrafts.forEach((draft) => {
        draft.activeGolfers.forEach((golferId) => {
          const player = players.find(p => p.id === draft.playerId);
          if (player) {
            newDraftState[golferId] = {
              golferId,
              draftedBy: player.name,
              draftedByImage: player.imageUrl,
              isSelectable: false,
            };
          }
        });
        const player = players.find(p => p.id === draft.playerId);
        if (player) {
          newDraftState[draft.alternateGolfer] = {
            golferId: draft.alternateGolfer,
            draftedBy: player.name,
            draftedByImage: player.imageUrl,
            isSelectable: false,
          };
        }
      });
      
      // Generate play-by-play from completed tournament
      const events: DraftEvent[] = [];
      newData.results.fatRandoStolenGolfers.forEach((golferId) => {
        const golfer = newGolfers.find(g => g.id === golferId);
        if (golfer) {
          events.push({
            type: 'steal',
            playerName: 'FAT RANDO',
            golferName: golfer.name,
            golferRank: golfer.rank,
            timestamp: new Date(),
          });
        }
      });
      newData.results.teamDrafts.forEach((draft) => {
        const player = players.find(p => p.id === draft.playerId);
        if (player) {
          draft.activeGolfers.forEach((golferId) => {
            const golfer = newGolfers.find(g => g.id === golferId);
            if (golfer) {
              events.push({
                type: 'select',
                playerName: player.name.toUpperCase(),
                golferName: golfer.name,
                golferRank: golfer.rank,
                timestamp: new Date(),
              });
            }
          });
        }
      });
      setPlayByPlayEvents(events);
    } else if (newState === 'draft') {
      if (USE_DRAFT_API) {
        newInternalDraftState = null; // Load effect will fetch from API
      } else {
        const saved = getCurrentDraftState(selectedTournament.id);
        if (saved) {
          newInternalDraftState = saved;
        } else {
          newInternalDraftState = initializeDraftState(selectedTournament.id, newGolfers, players);
          saveDraftState(selectedTournament.id, newInternalDraftState);
        }
      }
      
      // Update UI draft state from internal state (skip when loading from API)
      if (newInternalDraftState) {
        newGolfers.forEach((golfer) => {
          const isStolen = newInternalDraftState!.fatRandoStolenGolfers.includes(golfer.id);
          const pick = newInternalDraftState!.picks.find(p => p.golferId === golfer.id);
        
        if (isStolen) {
          newDraftState[golfer.id] = {
            golferId: golfer.id,
            draftedBy: 'Fat Rando',
            draftedByImage: '/images/Player_FatRando.jpg',
            isSelectable: false,
          };
        } else if (pick) {
          const player = players.find(p => p.id === pick.playerId);
          const imageUrl = getPlayerImageUrl(pick.playerId, players);
          newDraftState[golfer.id] = {
            golferId: golfer.id,
            draftedBy: player?.name || 'Unknown',
            draftedByImage: imageUrl,
            isSelectable: false,
          };
        } else {
          newDraftState[golfer.id] = {
            golferId: golfer.id,
            isSelectable: true,
          };
        }
      });
        setPlayByPlayEvents(newInternalDraftState.activityLog);
      }
    } else {
      setPlayByPlayEvents([]);
    }
    
    setDraftState(newDraftState);
    setInternalDraftState(newInternalDraftState);
  }, [selectedTournament, router]);

  // Load draft state from API when USE_DRAFT_API and tournament is in draft
  useEffect(() => {
    if (!USE_DRAFT_API || !selectedTournament || tournamentState !== 'draft') {
      if (USE_DRAFT_API) setDraftLoading(false);
      return;
    }
    if (golfers.length === 0 || players.length === 0) {
      setDraftLoading(true); // Wait for golfers/players to load
      return;
    }
    let cancelled = false;
    setDraftLoading(true);
    (async () => {
      try {
        const res = await fetchDraftState(selectedTournament.id);
        if (cancelled) return;
        if (res && res.teamDrafts && res.teamDrafts.length > 0) {
          router.push(`/tournament/${selectedTournament.id}/list`);
          return;
        }
        if (res && (res.draftState || (res as { picks?: unknown }).picks !== undefined)) {
          const { updatedAt, ...ds } = res as { updatedAt?: string } & DraftState;
          lastKnownUpdatedAtRef.current = updatedAt ?? null;
          lastLoadAtRef.current = Date.now();
          setInternalDraftState(ds as DraftState);
        } else {
          const initialized = initializeDraftState(selectedTournament.id, golfers, players);
          skipSaveFromPollRef.current = true;
          try {
            await saveDraftStateToApi(selectedTournament.id, initialized);
            if (cancelled) return;
            lastKnownUpdatedAtRef.current = new Date().toISOString();
            lastLoadAtRef.current = Date.now();
          } catch (saveErr) {
            if (!cancelled) console.warn('Failed to save draft state to API, using local state:', saveErr);
          }
          if (!cancelled) setInternalDraftState(initialized);
        }
      } catch (e) {
        if (!cancelled) console.error('Failed to load draft state:', e);
      } finally {
        if (!cancelled) setDraftLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [USE_DRAFT_API, selectedTournament?.id, tournamentState, golfers.length, players.length, router]);

  // SSE or polling: keep draft state in sync when another player makes a pick
  useEffect(() => {
    if (!USE_DRAFT_API || !selectedTournament || tournamentState !== 'draft' || !internalDraftState) return;

    const fetchAndApply = async () => {
      if (saveInProgressRef.current || skipSaveFromPollRef.current) return;
      // Brocation: skip apply when <1s since our save or since load (avoid race)
      if (Date.now() - lastSaveCompletedAtRef.current < 1000) return;
      if (Date.now() - lastLoadAtRef.current < 1000) return;
      try {
        const res = await fetchDraftState(selectedTournament.id);
        if (!res) return;
        if (res.teamDrafts && res.teamDrafts.length > 0) {
          router.push(`/tournament/${selectedTournament.id}/list`);
          return;
        }
        const serverUpdatedAt = (res as { updatedAt?: string }).updatedAt;
        if (serverUpdatedAt && serverUpdatedAt !== lastKnownUpdatedAtRef.current) {
          const { updatedAt, ...ds } = res as { updatedAt?: string } & DraftState;
          if ((ds as DraftState).picks) {
            lastKnownUpdatedAtRef.current = updatedAt ?? null;
            lastLoadAtRef.current = Date.now();
            setInternalDraftState(ds as DraftState);
          }
        }
      } catch {
        // ignore
      }
    };

    let pollIntervalId: number | null = null;

    const startPolling = () => {
      if (pollIntervalId) return;
      pollIntervalId = window.setInterval(fetchAndApply, 2000) as unknown as number;
      window.setTimeout(fetchAndApply, 1500);
    };

    const onFocus = () => fetchAndApply();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchAndApply();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // Try SSE first; fall back to polling on error
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(getDraftStreamUrl(selectedTournament.id));
      eventSource.onopen = () => fetchAndApply(); // sync on connect in case we missed an update
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data || '{}');
          if (data.type === 'update') fetchAndApply();
        } catch {
          fetchAndApply();
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        startPolling();
      };
    } catch {
      startPolling();
    }

    // If SSE failed to connect, we might have started polling in onerror. Otherwise start poll as backup after a delay.
    if (!eventSource) startPolling();

    return () => {
      eventSource?.close();
      if (pollIntervalId !== null) clearInterval(pollIntervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [USE_DRAFT_API, selectedTournament?.id, tournamentState, internalDraftState, router]);

  // Check on mount if draft is already complete (localStorage only when not using API)
  useEffect(() => {
    if (!selectedTournament) return;
    if (USE_DRAFT_API) return; // Load effect handles API mode
    const data = getTournamentData(selectedTournament.id);
    const state = getTournamentState(selectedTournament);
    const hasDraftDataInResults = data.results && data.results.teamDrafts && data.results.teamDrafts.length > 0;
    if (state === 'draft' && hasDraftDataInResults) {
      router.push(`/tournament/${selectedTournament.id}/list`);
    }
  }, [selectedTournament, router, players]);

  // Sync draft state and play-by-play when internal draft state changes (for real-time updates)
  useEffect(() => {
    if (!selectedTournament || tournamentState !== 'draft' || !internalDraftState) return;
    
    const syncedDraftState: Record<string, DraftStatus> = {};
    golfers.forEach((golfer) => {
      const isStolen = internalDraftState.fatRandoStolenGolfers.includes(golfer.id);
      const pick = internalDraftState.picks.find(p => p.golferId === golfer.id);
      
      if (isStolen) {
        syncedDraftState[golfer.id] = {
          golferId: golfer.id,
          draftedBy: 'Fat Rando',
          draftedByImage: '/images/Player_FatRando.jpg',
          isSelectable: false,
        };
      } else if (pick) {
        const player = players.find(p => p.id === pick.playerId);
        const imageUrl = getPlayerImageUrl(pick.playerId, players);
        syncedDraftState[golfer.id] = {
          golferId: golfer.id,
          draftedBy: player?.name || 'Unknown',
          draftedByImage: imageUrl,
          isSelectable: false,
        };
      } else {
        syncedDraftState[golfer.id] = {
          golferId: golfer.id,
          isSelectable: true,
        };
      }
    });
    
    setDraftState(syncedDraftState);
    setPlayByPlayEvents(internalDraftState.activityLog ?? []);
  }, [internalDraftState, golfers, players, selectedTournament, tournamentState]);

  const handleSelectGolfer = (golferId: string) => {
    // Only allow selection in draft state
    if (tournamentState !== 'draft' || !internalDraftState) return;
    
    // Manual testing mode: allow selection if a player is manually selected
    if (manualTestPlayerId) {
      const golfer = golfers.find((g) => g.id === golferId);
      if (golfer && draftState[golferId]?.isSelectable) {
        setSelectedGolferId(golferId);
        setIsModalOpen(true);
      }
      return;
    }
    
    // Normal mode: Check if it's the current user's turn
    const currentPlayer = getCurrentPlayer(internalDraftState, players);
    if (!currentPlayer || currentPlayer.id !== mockUser.id) {
      // Not the current user's turn
      return;
    }
    
    const golfer = golfers.find((g) => g.id === golferId);
    if (golfer && draftState[golferId]?.isSelectable) {
      setSelectedGolferId(golferId);
      setIsModalOpen(true);
    }
  };

  const handleTournamentSelect = (tournament: Tournament) => {
    const data = getTournamentData(tournament.id);
    const newState = getTournamentState(tournament);
    // If tournament is not in draft state, redirect to its tournament page
    if (newState !== 'draft') {
      router.push(`/tournament/${tournament.id}/list`);
      return;
    }
    // Otherwise, update the selected tournament on the draft page
    setSelectedTournament(tournament);
  };

  const handleRetryDraftCompletion = async () => {
    const pending = pendingCompletionRef.current;
    if (!pending || !selectedTournament) return;
    setCompletingDraftError(null);
    setCompletingDraft(true);
    try {
      await saveCompletedDraftToApi(selectedTournament.id, pending.teamDrafts, pending.fatRandoStolenGolfers);
      pendingCompletionRef.current = null;
      router.push(`/tournament/${selectedTournament.id}/list`);
    } catch (e) {
      console.error('Error completing draft:', e);
      setCompletingDraftError(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setCompletingDraft(false);
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedGolferId || !internalDraftState || !selectedTournament) {
      setIsModalOpen(false);
      setSelectedGolferId(null);
      return;
    }
    
    const golfer = golfers.find((g) => g.id === selectedGolferId);
    if (!golfer) {
      setIsModalOpen(false);
      setSelectedGolferId(null);
      return;
    }
    
    // Get current player - use manual test player if set, otherwise use actual current player
    const currentPlayer = manualTestPlayerId 
      ? players.find(p => p.id === manualTestPlayerId)
      : getCurrentPlayer(internalDraftState, players);
    
    if (!currentPlayer || !currentPlayer.imageUrl) {
      console.error('Current player not found or missing imageUrl:', currentPlayer);
      setIsModalOpen(false);
      setSelectedGolferId(null);
      return;
    }
    
    // Determine if this is an active golfer or alternate pick
    const playerPicks = internalDraftState.playerPicks[currentPlayer.id] || { activeGolfers: [] };
    const pickType: 'active' | 'alternate' = playerPicks.activeGolfers.length < 3 ? 'active' : 'alternate';
    
    // Update internal draft state
    const nextPick = internalDraftState.currentPick + 1;
    
    // Advance to next player in draft order based on pick number
    // The draftOrder array already contains the correct snake draft sequence
    // currentPick represents the number of picks made, which is also the index for the NEXT pick
    // currentPlayerIndex should match currentPick (they're redundant but kept for compatibility)
    const nextPlayerIndex = nextPick < internalDraftState.draftOrder.length
      ? nextPick
      : internalDraftState.draftOrder.length - 1; // Stay at last position if all picks are done
    
    const updatedState: DraftState = {
      ...internalDraftState,
      currentPick: nextPick,
      currentPlayerIndex: nextPlayerIndex,
      picks: [
        ...internalDraftState.picks,
        {
          pickNumber: internalDraftState.currentPick + 1,
          playerId: currentPlayer.id,
          golferId: selectedGolferId,
          pickType,
        },
      ],
      playerPicks: {
        ...internalDraftState.playerPicks,
        [currentPlayer.id]: {
          activeGolfers: pickType === 'active'
            ? [...playerPicks.activeGolfers, selectedGolferId]
            : playerPicks.activeGolfers,
          alternateGolfer: pickType === 'alternate' ? selectedGolferId : playerPicks.alternateGolfer,
        },
      },
      activityLog: [
        ...internalDraftState.activityLog,
        {
          type: 'select',
          playerName: currentPlayer.name.toUpperCase(),
          golferName: golfer.name,
          golferRank: golfer.rank,
          timestamp: new Date(),
        },
      ],
    };
    
    const draftComplete = isDraftComplete(updatedState, players);
    
    if (USE_DRAFT_API) {
      if (draftComplete) {
        // Completion flow: await both saves, only redirect on success
        const teamDrafts = players.map(player => {
          const picks = updatedState.playerPicks[player.id];
          return {
            playerId: player.id,
            activeGolfers: picks?.activeGolfers || [],
            alternateGolfer: picks?.alternateGolfer || '',
          };
        }).filter(draft => draft.activeGolfers.length === 3 && draft.alternateGolfer);

        setCompletingDraft(true);
        setCompletingDraftError(null);
        pendingCompletionRef.current = { teamDrafts, fatRandoStolenGolfers: updatedState.fatRandoStolenGolfers };
        skipSaveFromPollRef.current = true;
        saveInProgressRef.current = true;
        (async () => {
          try {
            await saveDraftStateToApi(selectedTournament.id, updatedState);
            await saveCompletedDraftToApi(selectedTournament.id, teamDrafts, updatedState.fatRandoStolenGolfers);
            lastSaveCompletedAtRef.current = Date.now();
            pendingCompletionRef.current = null;
            router.push(`/tournament/${selectedTournament.id}/list`);
          } catch (e) {
            console.error('Error completing draft:', e);
            setCompletingDraftError(e instanceof Error ? e.message : 'Failed to save draft');
          } finally {
            setCompletingDraft(false);
            saveInProgressRef.current = false;
          }
        })();
      } else {
        skipSaveFromPollRef.current = true;
        saveInProgressRef.current = true;
        saveDraftStateToApi(selectedTournament.id, updatedState)
          .then((res) => {
            lastKnownUpdatedAtRef.current = res.updatedAt ?? null;
            lastSaveCompletedAtRef.current = Date.now();
            skipSaveFromPollRef.current = false;
          })
          .catch((e) => console.error('Failed to save draft state:', e))
          .finally(() => { saveInProgressRef.current = false; });
      }
    }
    setInternalDraftState(updatedState);
    
    // Update UI draft state - ensure imageUrl is always set
    const imageUrl = getPlayerImageUrl(currentPlayer.id, players);
    
    setDraftState((prev) => ({
      ...prev,
      [selectedGolferId]: {
        golferId: selectedGolferId,
        draftedBy: currentPlayer.name,
        draftedByImage: imageUrl,
        isSelectable: false,
      },
    }));
    
    // Update play-by-play
    setPlayByPlayEvents(updatedState.activityLog);
    
    setIsModalOpen(false);
    setSelectedGolferId(null);
    
    // In manual mode, advance to next player in draft order based on updated state
    if (manualTestPlayerId && updatedState) {
      // Use getCurrentPlayer to get the next player (it uses currentPick which is already updated)
      const nextPlayer = getCurrentPlayer(updatedState, players);
      if (nextPlayer) {
        setManualTestPlayerId(nextPlayer.id);
      } else {
        // Draft is complete, clear manual mode
        setManualTestPlayerId(null);
      }
    }
  };

  const selectedGolfer = selectedGolferId
    ? golfers.find((g) => g.id === selectedGolferId)
    : null;

  // Get next player for draft banner (only show in draft state)
  // In manual mode, show the manually selected player; otherwise show the actual current player
  const nextPlayer = tournamentState === 'draft' && internalDraftState
    ? (manualTestPlayerId 
        ? players.find(p => p.id === manualTestPlayerId) 
        : getCurrentPlayer(internalDraftState, players))
    : null;

  // Pick number (1–4) for banner: 1–3 = active picks, 4 = alternate
  const draftPickNumber = internalDraftState && nextPlayer
    ? (manualTestPlayerId
        ? (() => {
            const pp = internalDraftState.playerPicks[nextPlayer.id] ?? { activeGolfers: [] };
            const picksMade = pp.activeGolfers.length + (pp.alternateGolfer ? 1 : 0);
            return Math.min(picksMade + 1, 4);
          })()
        : Math.min(Math.floor(internalDraftState.currentPick / players.length) + 1, 4))
    : 1;

  // Safety check - ensure we have a tournament
  if (!selectedTournament) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Loading tournament...</div>
        </div>
      </ProtectedRoute>
    );
  }

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
      <BackgroundImage
        imageSrc={selectedTournament.backgroundImage}
        alt={selectedTournament.name}
      />
      <Header
        currentView="tournament"
        viewMode="table"
        userProfile={mockUser}
        onViewChange={(view) => {
          if (view === 'season') router.push('/season');
        }}
        onViewModeChange={(mode) => {
          if (mode === 'list') router.push(`/tournament/${selectedTournament.id}/list`);
          else router.push(`/tournament/${selectedTournament.id}/table`);
        }}
      />
      <TournamentPicker
        tournaments={getTournaments()}
        selectedTournament={selectedTournament}
        onSelect={handleTournamentSelect}
        viewMode="draft"
      />
      {!isMobile && <TournamentVenue tournament={selectedTournament} viewMode="draft" />}
      <MainContainer top="252px" noPadding={true}>
        
        {tournamentState === 'pre-draft' && (
          <div className="p-4 md:p-10 w-full">
            <PreDraftBanner />
          </div>
        )}
        
        {tournamentState === 'draft' && draftLoading && (
          <div style={{ padding: '40px', color: '#ffffff', fontSize: '18px' }}>
            Loading draft...
          </div>
        )}
        {tournamentState === 'draft' && completingDraft && (
          <div style={{ padding: '40px', color: '#ffffff', fontSize: '18px' }}>
            Saving draft...
          </div>
        )}
        {tournamentState === 'draft' && completingDraftError && (
          <div
            style={{
              padding: '16px',
              marginBottom: '16px',
              backgroundColor: 'rgba(180, 0, 0, 0.3)',
              border: '1px solid #c00',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '1006px',
              color: '#ffffff',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Failed to save draft</div>
            <div style={{ marginBottom: '12px' }}>{completingDraftError}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleRetryDraftCompletion}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4a90e2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry save
              </button>
              <button
                onClick={() => {
                  setCompletingDraftError(null);
                  if (selectedTournament) router.push(`/tournament/${selectedTournament.id}/list`);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Go to team list
              </button>
            </div>
          </div>
        )}
        {tournamentState === 'draft' && !draftLoading && !completingDraft && nextPlayer && (
          <>
            <DraftBanner
              playerName={nextPlayer.name}
              playerImage={nextPlayer.imageUrl}
              pickNumber={draftPickNumber}
              possessivePronoun={nextPlayer.name === 'KristaKay' ? 'her' : 'his'}
            />
            {/* Manual Testing Mode Selector */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '8px',
                marginBottom: '16px',
                width: '100%',
                maxWidth: '1006px',
              }}
            >
              <div style={{ marginBottom: '8px', color: '#ffffff', fontSize: '14px', fontWeight: 700 }}>
                Manual Testing Mode (Select Player Making Pick):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {players.map((player) => {
                  const isSelected = manualTestPlayerId === player.id;
                  const playerPicks = internalDraftState?.playerPicks[player.id] || { activeGolfers: [] };
                  const picksRemaining = 3 - playerPicks.activeGolfers.length + (playerPicks.alternateGolfer ? 0 : 1);
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        if (isSelected) {
                          setManualTestPlayerId(null); // Toggle off
                        } else {
                          setManualTestPlayerId(player.id);
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isSelected ? '#4a90e2' : '#323232',
                        color: '#ffffff',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {player.name}
                      {picksRemaining > 0 && (
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>
                          ({picksRemaining} picks left)
                        </span>
                      )}
                    </button>
                  );
                })}
                {manualTestPlayerId && (
                  <button
                    onClick={() => setManualTestPlayerId(null)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#666',
                      color: '#ffffff',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    Auto Mode
                  </button>
                )}
              </div>
              {manualTestPlayerId && (
                <div style={{ marginTop: '8px', color: '#ffffff', fontSize: '12px', opacity: 0.8 }}>
                  Making picks as: <strong>{players.find(p => p.id === manualTestPlayerId)?.name}</strong>
                </div>
              )}
            </div>
          </>
        )}
        
        {(tournamentState === 'draft' || tournamentState === 'completed') && !(tournamentState === 'draft' && draftLoading) && (
          <div
            style={{
              display: 'flex',
              gap: isMobile ? 0 : '16px',
              alignItems: 'flex-start',
              position: 'relative',
              flexShrink: 0,
              width: isMobile ? '100%' : '1006px',
              overflowX: isMobile ? 'auto' : 'visible',
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            {(!isMobile || searchParams.get('panel') !== 'play-by-play') && (
              <div style={isMobile ? { width: '100%', minWidth: 0 } : undefined}>
                <DraftTable
                  golfers={golfers}
                  draftState={draftState}
                  onSelectGolfer={handleSelectGolfer}
                  players={players}
                  isMobile={isMobile}
                />
              </div>
            )}
            {(!isMobile || searchParams.get('panel') === 'play-by-play') && (
              <div style={isMobile ? { width: '100%', minWidth: 0, flex: 1 } : undefined}>
                <PlayByPlay events={playByPlayEvents} isMobile={isMobile} />
              </div>
            )}
          </div>
        )}
        
        {tournamentState === 'playing' && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Tournament In Progress</h2>
            <p>Tournament is currently being played.</p>
          </div>
        )}
      </MainContainer>
      <ConfirmationModal
        isOpen={isModalOpen}
        golferName={selectedGolfer?.name || ''}
        onConfirm={handleConfirmSelection}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedGolferId(null);
        }}
      />
    </div>
    </ProtectedRoute>
  );
}
