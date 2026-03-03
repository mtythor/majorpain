'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import BackgroundImage from '@/components/layout/BackgroundImage';
import MainContainer from '@/components/layout/MainContainer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  getCurrentUser,
  getTournament,
  getTournamentData,
  getGolfers,
} from '@/lib/data';
import { useApiData, useTournamentData } from '@/lib/use-api-data';
import { getTournamentState } from '@/lib/tournament-utils';

export default function TournamentResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backToView = (searchParams.get('view') === 'list' ? 'list' : 'table') as 'list' | 'table';
  const { loading: loadingData, error: dataError } = useApiData();
  const { loading: loadingTournament, error: tournamentError } = useTournamentData(params.id);
  
  const tournament = getTournament(params.id);
  const { results } = getTournamentData(params.id);
  
  // Check if we have golfer results (rounds) - this indicates tournament has started
  const hasGolferResults = results?.golferResults && results.golferResults.length > 0 && 
    results.golferResults.some(gr => gr.rounds && gr.rounds.length > 0);
  
  // Redirect to draft page if tournament is in draft state AND no results exist
  useEffect(() => {
    if (!loadingData && !loadingTournament && tournament) {
      const tournamentState = getTournamentState(tournament);
      // Only redirect if in draft state AND no golfer results exist
      if (tournamentState === 'draft' && !hasGolferResults) {
        router.push('/draft');
      }
    }
  }, [loadingData, loadingTournament, tournament, router, hasGolferResults]);
  
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
  
  // Check if tournament is in draft state with no results - if so, show loading while redirecting
  const tournamentState = getTournamentState(tournament);
  if (tournamentState === 'draft' && !hasGolferResults) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Redirecting to draft...</div>
        </div>
      </ProtectedRoute>
    );
  }
  
  const golfers = getGolfers(params.id);

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


  // Prepare golfer results data
  const golferResultsData = results && golfers
    ? results.golferResults
        .map((result) => {
          const golfer = golfers.find((g) => g.id === result.golferId);
          return golfer
            ? {
                ...result,
                golferName: golfer.name,
                golferRank: golfer.rank,
              }
            : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => {
          // If both have final positions, sort by position
          if (a.finalPosition !== null && b.finalPosition !== null) {
            return a.finalPosition - b.finalPosition;
          }
          // If one has final position and one doesn't, final position comes first
          if (a.finalPosition !== null) return -1;
          if (b.finalPosition !== null) return 1;
          // If neither has final position, sort by round 1 score (toPar)
          const aRound1Score = a.rounds[0]?.toPar ?? 999;
          const bRound1Score = b.rounds[0]?.toPar ?? 999;
          return aRound1Score - bRound1Score;
        })
    : [];

  // Calculate positions with tie handling
  // Helper function to calculate positions with tie handling
  const calculatePositionsWithTies = (
    golferResults: typeof golferResultsData,
    useFinalPosition: boolean
  ): Map<string, number> => {
    const positions = new Map<string, number>();
    
    // Filter to golfers with rounds
    const golfersWithRounds = golferResults.filter(r => r.rounds && r.rounds.length > 0);
    
    // Sort by score - use totalToPar if available and useFinalPosition is true, otherwise use round 1 toPar
    golfersWithRounds.sort((a, b) => {
      if (useFinalPosition && a.totalToPar !== undefined && b.totalToPar !== undefined) {
        return a.totalToPar - b.totalToPar;
      }
      const aScore = a.rounds[0]?.toPar ?? 999;
      const bScore = b.rounds[0]?.toPar ?? 999;
      return aScore - bScore;
    });
    
    // Assign positions with tie handling
    // Golfers with the same score share the same position, next position skips accordingly
    // Example: if 2 golfers tie at -5, they both get position 1, next golfer at -4 gets position 3
    let position = 1;
    for (let i = 0; i < golfersWithRounds.length; i++) {
      if (i > 0) {
        // Get current and previous scores
        const currentScore = useFinalPosition && golfersWithRounds[i].totalToPar !== undefined
          ? golfersWithRounds[i].totalToPar
          : golfersWithRounds[i].rounds[0]?.toPar ?? 999;
        const previousScore = useFinalPosition && golfersWithRounds[i - 1].totalToPar !== undefined
          ? golfersWithRounds[i - 1].totalToPar
          : golfersWithRounds[i - 1].rounds[0]?.toPar ?? 999;
        
        // If scores are different, advance position
        if (currentScore !== previousScore) {
          // Count how many golfers are tied at the previous position
          // Start from i-1 and count backwards all golfers with the same score
          let tiedCount = 0;
          let j = i - 1;
          while (j >= 0) {
            const prevScore = useFinalPosition && golfersWithRounds[j].totalToPar !== undefined
              ? golfersWithRounds[j].totalToPar
              : golfersWithRounds[j].rounds[0]?.toPar ?? 999;
            if (prevScore === previousScore) {
              tiedCount++;
              j--;
            } else {
              break;
            }
          }
          // Advance position: previous position + number of tied golfers
          // Example: if 2 golfers tie at position 1, next golfer gets position 3 (1 + 2)
          const previousPosition = positions.get(golfersWithRounds[i - 1].golferId) || position;
          position = previousPosition + tiedCount;
        }
        // If scores are the same, position stays the same (tied)
      }
      
      positions.set(golfersWithRounds[i].golferId, position);
    }
    
    return positions;
  };
  
  // Calculate positions: always use the same logic regardless of number of rounds
  // Use totalToPar if available (4 rounds), otherwise use round 1 toPar (partial results)
  const useTotalScore = golferResultsData.some(r => r.totalToPar !== undefined);
  
  // Calculate all positions using the same tie-handling logic
  const tempPositions = calculatePositionsWithTies(golferResultsData, useTotalScore);

  // Count how many golfers share each position (for tie display)
  const positionCounts: Record<number, number> = {};
  golferResultsData.forEach((result) => {
    const position = result.finalPosition ?? tempPositions.get(result.golferId);
    if (position !== undefined) {
      positionCounts[position] = (positionCounts[position] || 0) + 1;
    }
  });

  // Helper function to format position with "T" prefix for ties
  const formatPosition = (result: typeof golferResultsData[0]): string => {
    const position = result.finalPosition ?? tempPositions.get(result.golferId);
    if (position === undefined) return 'MC';
    // If more than one golfer has this position, it's a tie
    if (positionCounts[position] > 1) {
      return `T${position}`;
    }
    return position.toString();
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
          userProfile={getCurrentUser()}
          onViewChange={handleViewChange}
          onViewModeChange={handleViewModeChange}
        />
        {/* FULL LEADERBOARD Header */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '184px',
            transform: 'translateX(calc(-1 * var(--results-header-offset-x)))',
            zIndex: 1000,
          }}
        >
          <p
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: 'normal',
              color: '#ffffff',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            FULL LEADERBOARD
          </p>
        </div>
        {/* BACK TO TOURNAMENT Link */}
        <div
          style={{
            position: 'absolute',
            right: '50%',
            top: '184px',
            transform: 'translateX(var(--results-header-offset-x))',
            zIndex: 1000,
          }}
        >
          <Link
            href={`/tournament/${params.id}/${backToView}`}
            style={{
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: 'normal',
              color: '#3fa2ff',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            BACK TO TOURNAMENT
          </Link>
        </div>
        <MainContainer top="252px" noPadding={true}>
          {!results || !hasGolferResults || tournamentState === 'pre-draft' ? (
            <div style={{ padding: '40px', width: '100%', textAlign: 'center', color: '#ffffff' }}>
              <p>No results available for this tournament.</p>
            </div>
          ) : (
            <div
              style={{
                width: 'var(--table-width)',
                minWidth: 'var(--table-width)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                alignSelf: 'center',
                overflowX: 'auto',
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#151515',
                  border: '1px solid #323232',
                  height: '32px',
                  alignItems: 'center',
                }}
              >
                {/* POS Column */}
                <div
                  style={{
                    width: 'var(--results-col-pos)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid #323232',
                    padding: '0 16px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: '12px',
                      lineHeight: 'normal',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      margin: 0,
                    }}
                  >
                    POS
                  </p>
                </div>
                {/* PLAYER Column */}
                <div
                  style={{
                    width: 'var(--results-col-player)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    borderRight: '1px solid #323232',
                    padding: '0 16px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: '12px',
                      lineHeight: 'normal',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      margin: 0,
                    }}
                  >
                    PLAYER
                  </p>
                </div>
                {/* STROKES Column */}
                <div
                  style={{
                    width: 'var(--results-col-pos)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid #323232',
                    padding: '0 16px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: '12px',
                      lineHeight: 'normal',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      margin: 0,
                    }}
                  >
                    STROKES
                  </p>
                </div>
                {/* ROUND Columns */}
                {[1, 2, 3, 4].map((roundNum, index) => (
                  <div
                    key={roundNum}
                    style={{
                      width: 'var(--results-col-pos)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: index === 3 ? 'none' : '1px solid #323232',
                      padding: '0 16px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Open Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: '12px',
                        lineHeight: 'normal',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        margin: 0,
                      }}
                    >
                      ROUND {roundNum}
                    </p>
                  </div>
                ))}
              </div>

              {/* Table Rows */}
              {golferResultsData.map((result, index) => (
                <div
                  key={result.golferId}
                  style={{
                    display: 'flex',
                    backgroundColor: index % 2 === 0 ? '#262626' : '#1a1a1a',
                    border: '1px solid #323232',
                    borderTop: 'none',
                    height: '48px',
                    alignItems: 'center',
                  }}
                >
                  {/* POS */}
                  <div
                    style={{
                      width: 'var(--results-col-pos)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid #323232',
                      padding: '0 16px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Open Sans', sans-serif",
                        lineHeight: 'normal',
                        textAlign: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '16px',
                        margin: 0,
                      }}
                    >
                      {formatPosition(result)}
                    </p>
                  </div>
                  {/* PLAYER */}
                  <div
                    style={{
                      width: 'var(--results-col-player)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      borderRight: '1px solid #323232',
                      padding: '0 16px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Open Sans', sans-serif",
                        lineHeight: 'normal',
                        textAlign: 'left',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '16px',
                        margin: 0,
                      }}
                    >
                      {result.golferName}
                    </p>
                  </div>
                  {/* STROKES */}
                  <div
                    style={{
                      width: 'var(--results-col-pos)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid #323232',
                      padding: '0 16px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Open Sans', sans-serif",
                        lineHeight: 'normal',
                        textAlign: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '16px',
                        margin: 0,
                      }}
                    >
                      {result.totalToPar === 0 ? 'E' : (
                        <>
                          {result.totalToPar > 0 ? '+' : ''}
                          {result.totalToPar}
                        </>
                      )}
                    </p>
                  </div>
                  {/* ROUNDS */}
                  {[1, 2, 3, 4].map((roundNum, index) => (
                    <div
                      key={roundNum}
                      style={{
                        width: 'var(--results-col-pos)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: index === 3 ? 'none' : '1px solid #323232',
                        padding: '0 16px',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Open Sans', sans-serif",
                          lineHeight: 'normal',
                          textAlign: 'center',
                          color: result.rounds[roundNum - 1] ? '#ffffff' : '#707070',
                          fontWeight: 700,
                          fontSize: '16px',
                          margin: 0,
                        }}
                      >
                        {result.rounds[roundNum - 1]?.score ?? '-'}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </MainContainer>
      </div>
    </ProtectedRoute>
  );
}
