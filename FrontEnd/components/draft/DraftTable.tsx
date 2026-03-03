'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Golfer, DraftStatus, SortColumn, SortDirection, Player } from '@/lib/types';
import DraftTableColumn from './DraftTableColumn';
import DraftTableCell from './DraftTableCell';
import DraftTableHeader from './DraftTableHeader';
import DraftSelectButton from './DraftSelectButton';
import { parseOdds } from '@/lib/utils';
import { getPlayers } from '@/lib/data';

interface DraftTableProps {
  golfers: Golfer[];
  draftState: Record<string, DraftStatus>;
  onSelectGolfer: (golferId: string) => void;
  players?: Player[];
}

export default function DraftTable({ golfers, draftState, onSelectGolfer, players }: DraftTableProps) {
  const playersList = players || getPlayers();
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedGolfers = useMemo(() => {
    if (!sortColumn) return golfers;

    const sorted = [...golfers].sort((a, b) => {
      if (sortColumn === 'rank') {
        return sortDirection === 'asc' ? a.rank - b.rank : b.rank - a.rank;
      } else if (sortColumn === 'odds') {
        const aOdds = parseOdds(a.odds);
        const bOdds = parseOdds(b.odds);
        return sortDirection === 'asc' ? aOdds - bOdds : bOdds - aOdds;
      }
      return 0;
    });

    return sorted;
  }, [golfers, sortColumn, sortDirection]);

  const handleSort = (column: 'rank' | 'odds') => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingRight: '1px',
        position: 'relative',
        flexShrink: 0,
        width: '700px',
      }}
    >
      {/* Golfer Column */}
      <DraftTableColumn type="golfer">
        <DraftTableCell type="header" align="left">
          <p
            style={{
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 700,
              fontSize: '12px',
              lineHeight: 'normal',
              position: 'relative',
              flexShrink: 0,
              textAlign: 'center',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            Golfer
          </p>
        </DraftTableCell>
        {sortedGolfers.map((golfer, index) => {
          const rowType = index % 2 === 0 ? 'standard' : 'alt';
          return (
            <DraftTableCell key={golfer.id} type="data" rowType={rowType} align="left">
              <p
                style={{
                  fontFamily: "var(--font-noto-sans), sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: 'normal',
                  position: 'relative',
                  flexShrink: 0,
                  color: '#ffffff',
                }}
              >
                {golfer.name}
              </p>
            </DraftTableCell>
          );
        })}
      </DraftTableColumn>

      {/* Rank Column */}
      <DraftTableColumn type="rank">
        <DraftTableCell type="header">
          <DraftTableHeader
            label="rank"
            sortable
            sortDirection={sortColumn === 'rank' ? sortDirection : null}
            onSort={() => handleSort('rank')}
          />
        </DraftTableCell>
        {sortedGolfers.map((golfer, index) => {
          const rowType = index % 2 === 0 ? 'standard' : 'alt';
          return (
            <DraftTableCell key={golfer.id} type="data" rowType={rowType}>
              <p
                style={{
                  fontFamily: "var(--font-noto-sans), sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: 'normal',
                  position: 'relative',
                  flexShrink: 0,
                  textAlign: 'center',
                  color: '#ffffff',
                }}
              >
                {golfer.rank}
              </p>
            </DraftTableCell>
          );
        })}
      </DraftTableColumn>

      {/* Odds Column */}
      <DraftTableColumn type="odds">
        <DraftTableCell type="header">
          <DraftTableHeader
            label="odds"
            sortable
            sortDirection={sortColumn === 'odds' ? sortDirection : null}
            onSort={() => handleSort('odds')}
          />
        </DraftTableCell>
        {sortedGolfers.map((golfer, index) => {
          const rowType = index % 2 === 0 ? 'standard' : 'alt';
          return (
            <DraftTableCell key={golfer.id} type="data" rowType={rowType}>
              <p
                style={{
                  fontFamily: "var(--font-noto-sans), sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: 'normal',
                  position: 'relative',
                  flexShrink: 0,
                  textAlign: 'center',
                  color: '#ffffff',
                }}
              >
                {golfer.odds}
              </p>
            </DraftTableCell>
          );
        })}
      </DraftTableColumn>

      {/* Draft Column */}
      <DraftTableColumn type="draft">
        <DraftTableCell type="header">
          <p
            style={{
              fontFamily: "var(--font-noto-sans), sans-serif",
              fontWeight: 700,
              fontSize: '12px',
              lineHeight: 'normal',
              position: 'relative',
              flexShrink: 0,
              textAlign: 'center',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            Draft
          </p>
        </DraftTableCell>
        {sortedGolfers.map((golfer, index) => {
          const rowType = index % 2 === 0 ? 'standard' : 'alt';
          const draftStatus = draftState[golfer.id] || { golferId: golfer.id, isSelectable: true };
          
          return (
            <DraftTableCell key={golfer.id} type="data" rowType={rowType}>
              {draftStatus.draftedBy ? (
                (() => {
                  // Special handling for Fat Rando (not in players list)
                  let imageUrl = draftStatus.draftedByImage;
                  
                  // If no imageUrl in draftStatus, look up player by name
                  if (!imageUrl && draftStatus.draftedBy !== 'Fat Rando') {
                    const player = playersList.find(p => p.name === draftStatus.draftedBy);
                    imageUrl = player?.imageUrl;
                  }
                  
                  // Fallback for Fat Rando if not set
                  if (!imageUrl && draftStatus.draftedBy === 'Fat Rando') {
                    imageUrl = '/images/Player_FatRando.jpg';
                  }
                  
                  // If still no imageUrl found, show fallback
                  if (!imageUrl) {
                    return (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '40px',
                          backgroundColor: '#323232',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {draftStatus.draftedBy.charAt(0).toUpperCase()}
                      </div>
                    );
                  }
                  
                  // Render image - exactly like PlayerCards and PlayerTables do it
                  return (
                    <div
                      style={{
                        position: 'relative',
                        width: '32px',
                        height: '32px',
                        borderRadius: '40px',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={draftStatus.draftedBy}
                        width={32}
                        height={32}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                        }}
                      />
                    </div>
                  );
                })()
              ) : (
                <DraftSelectButton
                  onClick={() => onSelectGolfer(golfer.id)}
                  disabled={!draftStatus.isSelectable}
                />
              )}
            </DraftTableCell>
          );
        })}
      </DraftTableColumn>
    </div>
  );
}
