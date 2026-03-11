'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import BackgroundImage from '@/components/layout/BackgroundImage';
import TournamentPicker from '@/components/tournament/TournamentPicker';
import TournamentVenue from '@/components/tournament/TournamentVenue';
import PlayerTables from '@/components/tournament/PlayerTables';
import PreDraftBanner from '@/components/tournament/PreDraftBanner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Tournament, TeamDraft } from '@/lib/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  getCurrentUser,
  getTournament,
  getTournaments,
  getTournamentData,
  getPlayers,
} from '@/lib/data';
import { useApiData, useTournamentData } from '@/lib/use-api-data';
import { getTournamentState, shouldShowPreDraftBanner } from '@/lib/tournament-view';
import { isUpcomingTournament } from '@/lib/tournament-utils';
import { pointsFromPosition } from '@/lib/constants';

// Player colors
const playerColors: Record<string, string> = {
  '1': '#74a553', // MtyThor
  '2': '#3ca1ff', // Atticus
  '3': '#e12c55', // KristaKay
  '4': '#ff7340', // MrHattyhat
  '5': '#88584d', // Fat Rando
};

// Helper function to calculate positions with tie handling
// Only golfers who made cut and didn't withdraw get numeric positions
function calculatePositions(
  golferResults: Array<{
    golferId: string;
    rounds: Array<{ toPar: number }>;
    totalToPar?: number;
    finalPosition?: number | null;
    madeCut?: boolean;
    status?: string;
  }>,
  useFinalPosition: boolean
): Map<string, number> {
  const positions = new Map<string, number>();

  const golfersWithRounds = golferResults.filter(
    (r) =>
      r.rounds &&
      r.rounds.length > 0 &&
      r.madeCut === true &&
      r.status !== 'withdrawn'
  );
  
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
}

// Transform tournament results into table format
function getPlayerTableData(tournamentId: string) {
  const { tournament, golfers, results } = getTournamentData(tournamentId);
  
  if (!tournament) {
    return [];
  }

  const players = getPlayers();
  
  const teamDrafts: TeamDraft[] | undefined = results?.teamDrafts;
  const fatRandoStolenGolfers: string[] = results?.fatRandoStolenGolfers ?? [];
  
  if (!teamDrafts || teamDrafts.length === 0) {
    return [];
  }
  
  // TypeScript guard: teamDrafts is now guaranteed to be defined and non-empty
  const validTeamDrafts: TeamDraft[] = teamDrafts;
  
  // Check if we have golfer results (rounds) - this indicates tournament has started
  const hasGolferResults = results?.golferResults && results.golferResults.length > 0 && 
    results.golferResults.some(gr => gr.rounds && gr.rounds.length > 0);
  // hasResults means tournament is complete (has teamScores), hasGolferResults means rounds have started
  const hasResults = results?.teamScores && results.teamScores.length > 0;

  // Calculate positions with tie handling (same logic as leaderboard)
  const useTotalScore = !!(hasResults && results?.golferResults?.some(r => r.totalToPar !== undefined));
  const calculatedPositions = hasGolferResults && results
    ? calculatePositions(results.golferResults, useTotalScore)
    : new Map<string, number>();
  
  // Count how many golfers share each position (for "T" prefix) - only those who made cut
  const positionCounts: Record<number, number> = {};
  if (hasGolferResults && results) {
    results.golferResults.forEach((result) => {
      if (result.status === 'withdrawn' || result.madeCut !== true) return;
      const position = result.finalPosition ?? calculatedPositions.get(result.golferId);
      if (position !== undefined) {
        positionCounts[position] = (positionCounts[position] || 0) + 1;
      }
    });
  }

  // Helper function to format position with "T" prefix for ties
  const formatPosition = (
    golferId: string,
    finalPosition: number | null | undefined,
    madeCut?: boolean,
    status?: string
  ): string => {
    if (status === 'withdrawn') return 'WD';
    if (madeCut !== true) return 'CUT';
    const position = finalPosition ?? calculatedPositions.get(golferId);
    if (position === undefined) return '--';
    if (positionCounts[position] > 1) return `T${position}`;
    return position.toString();
  };

  // Calculate average position and totals for each player (only active golfers, not alternates)
  const playerAvgPositions: Record<string, number> = {};
  const playerStrokesTotals: Record<string, number> = {};
  
  if (hasGolferResults && results) {
    validTeamDrafts.forEach((draft) => {
      const golferPositions: number[] = [];
      let totalStrokes = 0;
      
      // Only count active golfers (not alternates) for average position
      draft.activeGolfers.forEach((golferId) => {
        const golferResult = results.golferResults?.find((r) => r.golferId === golferId);
        if (golferResult) {
          // Get numeric position (extract from formatted string if needed)
          const position = golferResult.finalPosition ?? calculatedPositions.get(golferId);
          if (position !== undefined) {
            golferPositions.push(position);
          }
          if (hasResults && golferResult.totalToPar !== undefined) {
            totalStrokes += golferResult.totalToPar;
          } else if (golferResult.rounds && golferResult.rounds.length > 0) {
            totalStrokes += golferResult.rounds[0]?.toPar ?? 0;
          }
        }
      });
      
      const avgPos = golferPositions.length > 0
        ? Math.round(golferPositions.reduce((sum, pos) => sum + pos, 0) / golferPositions.length)
        : 0;
      
      playerAvgPositions[draft.playerId] = avgPos;
      playerStrokesTotals[draft.playerId] = totalStrokes;
    });
  }

  // Build table data for regular players
  const playerTables = validTeamDrafts.map((draft) => {
    const player = players.find((p) => p.id === draft.playerId);
    const teamScore = hasResults ? results?.teamScores?.find((ts) => ts.playerId === draft.playerId) : null;
    
    if (!player) {
      return null;
    }
    
    // If no final results yet, show table with draft data and round scores if available
    if (!hasResults) {
      // Calculate temporary positions based on current scores (round 1, or cumulative if more rounds)
      const tempPositions = hasGolferResults && results
        ? calculatePositions(results.golferResults, useTotalScore)
        : new Map<string, number>();
      
      const golferTableData = draft.activeGolfers.map((golferId) => {
        const golfer = golfers.find((g) => g.id === golferId);
        if (!golfer) return null;
        
        // If we have golfer results, get the round 1 score
        let golferResult = null;
        if (hasGolferResults && results) {
          golferResult = results.golferResults.find((r) => r.golferId === golferId);
        }
        
        // Format position with "T" prefix for ties (same as leaderboard)
        const positionStr = golferResult
          ? formatPosition(golferId, golferResult.finalPosition, golferResult.madeCut, golferResult.status)
          : (hasGolferResults ? '--' : '--');
        
        // Compute points from current position (scores update as rounds are entered)
        const position = tempPositions.get(golferId);
        const pts = position !== undefined ? pointsFromPosition(position) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 };
        
        const status: 'cut' | 'wd' | undefined =
          !golferResult ? undefined
          : golferResult.status === 'withdrawn' ? 'wd'
          : golferResult.madeCut !== true ? 'cut' : undefined;
        return {
          position: positionStr,
          name: golfer.name,
          strokes: golferResult?.rounds[0]?.toPar ?? (hasGolferResults ? 0 : 0),
          rounds: golferResult?.rounds.map((r) => r.score) || [],
          points: pts.basePoints,
          bonus: pts.bonusPoints,
          total: pts.totalPoints,
          status,
        };
      }).filter((g): g is NonNullable<typeof g> => g !== null);
      
      // Add alternate golfer
      const alternateGolfer = golfers.find((g) => g.id === draft.alternateGolfer);
      if (alternateGolfer) {
        let alternateResult = null;
        if (hasGolferResults && results) {
          alternateResult = results.golferResults.find((r) => r.golferId === draft.alternateGolfer);
        }
        const alternateSubstitutedIn = hasGolferResults && results && alternateResult?.madeCut === true && draft.activeGolfers.some((id) => {
          const gr = results.golferResults?.find((r) => r.golferId === id);
          return gr && gr.madeCut !== true;
        });
        const tempAltPosition = tempPositions.get(draft.alternateGolfer);
        const altPositionStr = alternateResult
          ? formatPosition(draft.alternateGolfer, alternateResult.finalPosition, alternateResult.madeCut, alternateResult.status)
          : (hasGolferResults ? '--' : '--');
        const altPts = tempAltPosition !== undefined ? pointsFromPosition(tempAltPosition) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 };
        
        golferTableData.push({
          position: altPositionStr,
          name: alternateGolfer.name,
          strokes: alternateResult?.rounds[0]?.toPar ?? (hasGolferResults ? 0 : 0),
          rounds: alternateResult?.rounds.map((r) => r.score) || [],
          points: altPts.basePoints,
          bonus: altPts.bonusPoints,
          total: altPts.totalPoints,
          status: alternateSubstitutedIn ? undefined : 'alt',
        });
      }
      
      // Sum player totals from active golfers (top 3)
      const activeGolferData = golferTableData.slice(0, 3);
      const playerTotal = activeGolferData.reduce((sum, g) => sum + g.total, 0);
      const playerBonus = activeGolferData.reduce((sum, g) => sum + g.bonus, 0);
      const playerPoints = activeGolferData.reduce((sum, g) => sum + g.points, 0);
      
      return {
        id: player.id,
        name: player.name,
        imageUrl: player.imageUrl,
        color: playerColors[player.id] || '#707070',
        avgPos: 0,
        strokesTotal: golferTableData.slice(0, 3).reduce((sum, g) => sum + g.strokes, 0),
        points: playerPoints,
        bonus: playerBonus,
        total: playerTotal,
        golfers: golferTableData,
        hasResults: false,
      };
    }
    
    // Original logic for when results exist
    if (!teamScore || !results) {
      return null;
    }

    // Get golfer data for active golfers and alternate
    // Always show each golfer's actual result (no substitution for display - matches list/leaderboard)
    const golferTableData = draft.activeGolfers.map((golferId) => {
      const golferResult = results.golferResults?.find((r) => r.golferId === golferId);
      const golfer = golfers.find((g) => g.id === golferId);
      
      if (!golferResult || !golfer) {
        return null;
      }

      // Use golfer's actual result (substitution only affects team totals, not row display)
      const resultToUse = golferResult;

      // Format position with "T" prefix for ties (same as leaderboard)
      const positionStr = formatPosition(golferId, resultToUse.finalPosition, resultToUse.madeCut, resultToUse.status);
      
      // Use stored points when available (final results), otherwise compute from current position
      const position = resultToUse.finalPosition ?? calculatedPositions.get(golferId);
      const pts = resultToUse.totalPoints > 0
        ? { basePoints: resultToUse.basePoints, bonusPoints: resultToUse.bonusPoints, totalPoints: resultToUse.totalPoints }
        : (position !== undefined ? pointsFromPosition(position) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 });
      
      const status: 'cut' | 'wd' | undefined =
        resultToUse.status === 'withdrawn' ? 'wd' : resultToUse.madeCut !== true ? 'cut' : undefined;
      return {
        position: positionStr,
        name: golfer.name,
        strokes: resultToUse.totalToPar ?? resultToUse.rounds?.[0]?.toPar ?? 0,
        rounds: (resultToUse.rounds || []).map((r) => r.score),
        points: pts.basePoints,
        bonus: pts.bonusPoints,
        total: pts.totalPoints,
        status,
      };
    }).filter((g): g is NonNullable<typeof g> => g !== null);

      // Add alternate golfer
      const alternateGolfer = golfers.find((g) => g.id === draft.alternateGolfer);
      const alternateResult = results.golferResults?.find(
        (r) => r.golferId === draft.alternateGolfer
      );
      
      if (alternateGolfer && alternateResult) {
        // Alternate substituted in when: at least one active missed cut AND alternate made cut
        const alternateSubstitutedIn = draft.activeGolfers.some((id) => {
          const gr = results.golferResults?.find((r) => r.golferId === id);
          return gr && gr.madeCut !== true;
        }) && alternateResult.madeCut === true;

        // Format position with "T" prefix for ties (same as leaderboard)
        const altPositionStr = formatPosition(draft.alternateGolfer, alternateResult.finalPosition, alternateResult.madeCut, alternateResult.status);
        const altPosition = alternateResult.finalPosition ?? calculatedPositions.get(draft.alternateGolfer);
        const altPts = alternateResult.totalPoints > 0
          ? { basePoints: alternateResult.basePoints, bonusPoints: alternateResult.bonusPoints, totalPoints: alternateResult.totalPoints }
          : (altPosition !== undefined ? pointsFromPosition(altPosition) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 });
        
        golferTableData.push({
          position: altPositionStr,
          name: alternateGolfer.name,
          strokes: alternateResult.totalToPar ?? alternateResult.rounds?.[0]?.toPar ?? 0,
          rounds: (alternateResult.rounds || []).map((r) => r.score),
          points: altPts.basePoints,
          bonus: altPts.bonusPoints,
          total: altPts.totalPoints,
          status: alternateSubstitutedIn ? undefined : 'alt',
        });
      }

    // Compute totals with substitution: alternate replaces first cut only
    let alternateUsedForTotals = false;
    let totalPoints = 0;
    let totalBonus = 0;
    for (let i = 0; i < 3; i++) {
      const golferId = draft.activeGolfers[i];
      const gr = results.golferResults?.find((r) => r.golferId === golferId);
      const alternateResult = results.golferResults?.find((r) => r.golferId === draft.alternateGolfer);
      if (!gr) continue;
      if (gr.madeCut === true) {
        totalPoints += gr.basePoints ?? 0;
        totalBonus += gr.bonusPoints ?? 0;
      } else if (!alternateUsedForTotals && alternateResult?.madeCut === true) {
        totalPoints += alternateResult.basePoints ?? 0;
        totalBonus += alternateResult.bonusPoints ?? 0;
        alternateUsedForTotals = true;
      }
    }
    const totalTotal = totalPoints + totalBonus;

    return {
      id: player.id,
      name: player.name,
      imageUrl: player.imageUrl,
      color: playerColors[player.id] || '#707070',
      avgPos: playerAvgPositions[player.id] || 0,
      strokesTotal: playerStrokesTotals[player.id] || 0,
      points: totalPoints,
      bonus: totalBonus,
      total: totalTotal,
      golfers: golferTableData,
      hasResults: true,
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  // Add Fat Rando (player ID '5')
  if (fatRandoStolenGolfers.length > 0) {
    const fatRandoGolfers = fatRandoStolenGolfers.slice(0, 4);
    
    // If no results yet, show Fat Rando table with draft data and round scores if available
    if (!hasResults) {
      // Calculate temporary positions based on current scores
      const tempPositions = hasGolferResults && results
        ? calculatePositions(results.golferResults, useTotalScore)
        : new Map<string, number>();
      
      const fatRandoGolferData = fatRandoGolfers.map((golferId, index) => {
        const golfer = golfers.find((g) => g.id === golferId);
        if (!golfer) return null;
        
        // If we have golfer results, get the round 1 score
        let golferResult = null;
        if (hasGolferResults && results) {
          golferResult = results.golferResults.find((r) => r.golferId === golferId);
        }
        
        // Format position with "T" prefix for ties (same as leaderboard)
        const positionStr = golferResult
          ? formatPosition(golferId, golferResult.finalPosition, golferResult.madeCut, golferResult.status)
          : (hasGolferResults ? '--' : '--');
        
        // Compute points from current position
        const position = tempPositions.get(golferId);
        const pts = position !== undefined ? pointsFromPosition(position) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 };
        const alternateSubstitutedIn = index === 3 && golferResult?.madeCut === true && (hasGolferResults && results
          ? fatRandoGolfers.slice(0, 3).some((id) => {
              const gr = results.golferResults?.find((r) => r.golferId === id);
              return gr && gr.madeCut !== true;
            })
          : false);
        const status: 'cut' | 'wd' | 'alt' | undefined =
          index === 3 ? (alternateSubstitutedIn ? undefined : 'alt')
          : !golferResult ? undefined
          : golferResult.status === 'withdrawn' ? 'wd'
          : golferResult.madeCut !== true ? 'cut' : undefined;
        return {
          position: positionStr,
          name: golfer.name,
          strokes: golferResult?.rounds[0]?.toPar ?? (hasGolferResults ? 0 : 0),
          rounds: golferResult?.rounds.map((r) => r.score) || [],
          points: pts.basePoints,
          bonus: pts.bonusPoints,
          total: pts.totalPoints,
          status,
        };
      }).filter((g): g is NonNullable<typeof g> => g !== null);
      
      // Calculate average position for active golfers (non-alternate)
      const activeGolferPositions = fatRandoGolferData.slice(0, 3)
        .map(g => {
          const posStr = typeof g.position === 'string' ? g.position : String(g.position);
          // Extract numeric position from "T1" -> 1, "1" -> 1
          const numPos = parseInt(posStr.replace('T', ''), 10);
          return isNaN(numPos) ? null : numPos;
        })
        .filter((pos): pos is number => pos !== null);
      
      const avgPos = activeGolferPositions.length > 0
        ? Math.round(activeGolferPositions.reduce((sum, pos) => sum + pos, 0) / activeGolferPositions.length)
        : 0;
      
      const activeGolferData = fatRandoGolferData.slice(0, 3);
      const playerTotal = activeGolferData.reduce((sum, g) => sum + g.total, 0);
      const playerBonus = activeGolferData.reduce((sum, g) => sum + g.bonus, 0);
      const playerPoints = activeGolferData.reduce((sum, g) => sum + g.points, 0);
      
      playerTables.push({
        id: '5',
        name: 'Fat Rando',
        imageUrl: '/images/Player_FatRando.jpg',
        color: playerColors['5'] || '#88584d',
        avgPos: avgPos,
        strokesTotal: fatRandoGolferData.slice(0, 3).reduce((sum, g) => sum + g.strokes, 0),
        points: playerPoints,
        bonus: playerBonus,
        total: playerTotal,
        golfers: fatRandoGolferData,
        hasResults: false,
      });
    } else {
      // Original logic for when results exist
      const fatRandoGolferData = fatRandoGolfers.map((golferId, index) => {
        const golferResult = results?.golferResults?.find((r) => r.golferId === golferId);
        const golfer = golfers.find((g) => g.id === golferId);
        
        if (!golferResult || !golfer) {
          return null;
        }

        // Format position with "T" prefix for ties (same as leaderboard)
        const positionStr = formatPosition(golferId, golferResult.finalPosition, golferResult.madeCut, golferResult.status);

        // Use stored points when available, otherwise compute from current position
        const position = golferResult.finalPosition ?? calculatedPositions.get(golferId);
        const pts = golferResult.totalPoints > 0
          ? { basePoints: golferResult.basePoints, bonusPoints: golferResult.bonusPoints, totalPoints: golferResult.totalPoints }
          : (position !== undefined ? pointsFromPosition(position) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 });
        const alternateSubstitutedIn = index === 3 && golferResult.madeCut === true && fatRandoGolfers.slice(0, 3).some((id) => {
          const gr = results?.golferResults?.find((r) => r.golferId === id);
          return gr && gr.madeCut !== true;
        });
        const status: 'cut' | 'wd' | 'alt' | undefined =
          index === 3 ? (alternateSubstitutedIn ? undefined : 'alt')
          : golferResult.status === 'withdrawn' ? 'wd'
          : golferResult.madeCut !== true ? 'cut' : undefined;
        return {
          position: positionStr,
          name: golfer.name,
          strokes: golferResult.totalToPar ?? golferResult.rounds?.[0]?.toPar ?? 0,
          rounds: (golferResult.rounds || []).map((r) => r.score),
          points: pts.basePoints,
          bonus: pts.bonusPoints,
          total: pts.totalPoints,
          status,
        };
      }).filter((g): g is NonNullable<typeof g> => g !== null);
      
      // Calculate average position for active golfers (non-alternate)
      const activeGolferPositions = fatRandoGolferData.slice(0, 3)
        .map(g => {
          const posStr = typeof g.position === 'string' ? g.position : String(g.position);
          // Extract numeric position from "T1" -> 1, "1" -> 1
          const numPos = parseInt(posStr.replace('T', ''), 10);
          return isNaN(numPos) ? null : numPos;
        })
        .filter((pos): pos is number => pos !== null);
      
      const avgPos = activeGolferPositions.length > 0
        ? Math.round(activeGolferPositions.reduce((sum, pos) => sum + pos, 0) / activeGolferPositions.length)
        : 0;

      // Add a placeholder alternate if needed
      if (fatRandoGolferData.length === 3 && fatRandoStolenGolfers.length > 3) {
        const altGolferId = fatRandoStolenGolfers[3];
        const altGolferResult = results?.golferResults?.find((r) => r.golferId === altGolferId);
        const altGolfer = golfers.find((g) => g.id === altGolferId);
        
        if (altGolfer && altGolferResult) {
          const altSubstitutedIn = altGolferResult.madeCut === true && fatRandoGolfers.slice(0, 3).some((id) => {
            const gr = results?.golferResults?.find((r) => r.golferId === id);
            return gr && gr.madeCut !== true;
          });
          // Format position with "T" prefix for ties (same as leaderboard)
          const altPositionStr = formatPosition(altGolferId, altGolferResult.finalPosition, altGolferResult.madeCut, altGolferResult.status);
          const altPosition = altGolferResult.finalPosition ?? calculatedPositions.get(altGolferId);
          const altPts = altGolferResult.totalPoints > 0
            ? { basePoints: altGolferResult.basePoints, bonusPoints: altGolferResult.bonusPoints, totalPoints: altGolferResult.totalPoints }
            : (altPosition !== undefined ? pointsFromPosition(altPosition) : { basePoints: 0, bonusPoints: 0, totalPoints: 0 });
          
          fatRandoGolferData.push({
            position: altPositionStr,
            name: altGolfer.name,
            strokes: altGolferResult.totalToPar ?? altGolferResult.rounds?.[0]?.toPar ?? 0,
            rounds: (altGolferResult.rounds || []).map((r) => r.score),
            points: altPts.basePoints,
            bonus: altPts.bonusPoints,
            total: altPts.totalPoints,
            status: altSubstitutedIn ? undefined : 'alt',
          });
        }
      }

      // Calculate Fat Rando totals (use top 3 golfers - active, non-alternate)
      const fatRandoPositions = fatRandoGolferData
        .slice(0, 3)
        .map(g => {
          const posStr = typeof g.position === 'string' ? g.position : String(g.position);
          // Extract numeric position from "T1" -> 1, "1" -> 1
          const numPos = parseInt(posStr.replace('T', ''), 10);
          return isNaN(numPos) ? null : numPos;
        })
        .filter((pos): pos is number => pos !== null);
      
      const fatRandoAvgPos = fatRandoPositions.length > 0
        ? Math.round(fatRandoPositions.reduce((sum, pos) => sum + pos, 0) / fatRandoPositions.length)
        : 0;
      
      const fatRandoStrokesTotal = fatRandoGolferData
        .slice(0, 3)
        .reduce((sum, g) => sum + g.strokes, 0);
      
      const fatRandoPoints = fatRandoGolferData
        .slice(0, 3)
        .reduce((sum, g) => sum + g.points, 0);
      
      const fatRandoBonus = fatRandoGolferData
        .slice(0, 3)
        .reduce((sum, g) => sum + g.bonus, 0);

      playerTables.push({
        id: '5',
        name: 'Fat Rando',
        imageUrl: '/images/Player_FatRando.jpg',
        color: playerColors['5'] || '#88584d',
        avgPos: fatRandoAvgPos,
        strokesTotal: fatRandoStrokesTotal,
        points: fatRandoPoints,
        bonus: fatRandoBonus,
        total: fatRandoPoints + fatRandoBonus,
        golfers: fatRandoGolferData,
        hasResults: true,
      });
    }
  }

  // Sort tables by total score (descending), but always put Fat Rando at the bottom
  playerTables.sort((a, b) => {
    // Fat Rando (id === '5') always goes to the bottom
    if (a.id === '5') return 1;
    if (b.id === '5') return -1;
    // Otherwise sort by total score descending
    return b.total - a.total;
  });

  return playerTables;
}

export default function TournamentTableView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { loading: loadingData, error: dataError } = useApiData();
  const { loading: loadingTournament, error: tournamentError } = useTournamentData(params.id);
  
  // All hooks must be called before any conditional returns
  const [playerTableData, setPlayerTableData] = useState<ReturnType<typeof getPlayerTableData>>([]);
  const [isLoadingTableData, setIsLoadingTableData] = useState(true);
  
  const tournaments = getTournaments();
  const tournament = getTournament(params.id) ?? tournaments[0];
  const { results } = getTournamentData(params.id);
  
  // Load player table data - use state to handle client-side localStorage access
  useEffect(() => {
    // Load table data client-side so we can access localStorage
    setIsLoadingTableData(true);
    const tableData = getPlayerTableData(params.id);
    setPlayerTableData(tableData);
    setIsLoadingTableData(false);
  }, [params.id, results]);
  
  // Redirect to draft page if tournament is in draft state AND no draft data exists yet
  useEffect(() => {
    if (!loadingData && !loadingTournament && tournament) {
      const tournamentState = getTournamentState(tournament);
      const players = getPlayers();
      
      const hasDraftDataInResults = results && results.teamDrafts && results.teamDrafts.length > 0;
      const hasAnyDraftData = hasDraftDataInResults;
      if (tournamentState === 'draft' && !hasAnyDraftData) {
        router.push(`/draft?tournament=${tournament.id}`);
      }
    }
  }, [loadingData, loadingTournament, tournament, router, results]);

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
  
  // Get tournament data
  const players = getPlayers();
  
  // Check if tournament is in draft state with no draft data - if so, show loading while redirecting
  const tournamentState = getTournamentState(tournament);
  
  const hasDraftDataInResults = results && results.teamDrafts && results.teamDrafts.length > 0;
  const hasAnyDraftData = hasDraftDataInResults;
  
  if (tournamentState === 'draft' && !hasAnyDraftData) {
    return (
      <ProtectedRoute>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Redirecting to draft...</div>
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
    router.push(`/tournament/${selectedTournament.id}/table`);
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
        showListTableToggle={!isUpcomingTournament(tournament)}
      />
      <TournamentPicker
        tournaments={tournaments}
        selectedTournament={tournament}
        onSelect={handleTournamentSelect}
        viewMode="table"
      />
      <div className="tournament-venue-desktop">
        <TournamentVenue tournament={tournament} viewMode="table" />
      </div>
      {isLoadingTableData ? (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            left: isMobile ? 0 : '50%',
            top: isMobile ? '169px' : '232px',
            transform: isMobile ? 'none' : 'translateX(-50%)',
            zIndex: 5,
            width: isMobile ? '100%' : '1057px',
            padding: 0,
            boxSizing: 'border-box',
            color: '#ffffff',
          }}
        >
          Loading table data...
        </div>
      ) : shouldShowPreDraftBanner(tournamentState) ? (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'flex-start',
            left: isMobile ? 0 : '50%',
            top: isMobile ? '169px' : '232px',
            transform: isMobile ? 'none' : 'translateX(-50%)',
            zIndex: 5,
            width: isMobile ? '100%' : '1057px',
            padding: 0,
            boxSizing: 'border-box',
          }}
        >
          <PreDraftBanner />
        </div>
      ) : playerTableData.length > 0 ? (
        <div
          style={{
            position: isMobile ? 'relative' : 'absolute',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'flex-start',
            left: isMobile ? 0 : '50%',
            top: isMobile ? undefined : '232px',
            marginTop: isMobile ? '169px' : undefined,
            transform: isMobile ? 'none' : 'translateX(-50%)',
            zIndex: 5,
            width: isMobile ? '100%' : undefined,
            padding: isMobile ? '0 8px' : 0,
            paddingBottom: isMobile ? '24px' : undefined,
            boxSizing: 'border-box',
            overflowX: isMobile ? 'auto' : 'visible',
          }}
        >
          <PlayerTables players={playerTableData} position="relative" isMobile={isMobile} />
          {results && results.golferResults && results.golferResults.length > 0 &&
            results.golferResults.some((gr) => gr.rounds && gr.rounds.length > 0) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: isMobile ? '100%' : '1057px',
                paddingTop: '8px',
                paddingBottom: '24px',
              }}
            >
              <Link
                href={`/tournament/${params.id}/results?view=table`}
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
                VIEW FULL LEADERBOARD
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            left: isMobile ? 0 : '50%',
            top: isMobile ? '169px' : '232px',
            transform: isMobile ? 'none' : 'translateX(-50%)',
            zIndex: 5,
            width: isMobile ? '100%' : '1057px',
            padding: 40,
            color: '#ffffff',
            opacity: 0.9,
            textAlign: 'center',
          }}
        >
          No draft results for this tournament. Seed test data in admin.
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
