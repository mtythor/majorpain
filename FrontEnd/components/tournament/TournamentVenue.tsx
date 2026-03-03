'use client';

import { Tournament } from '@/lib/types';

interface TournamentVenueProps {
  tournament: Tournament;
  viewMode: 'list' | 'table' | 'draft';
}

export default function TournamentVenue({ tournament, viewMode }: TournamentVenueProps) {
  if (!tournament.venue) {
    return null;
  }

  const { name, par, location } = tournament.venue;

  // Calculate right edge alignment based on view mode
  // List view: PlayerCards is 800px wide, positioned at left: 50%, transform: translateX(-400px)
  //   Right edge is at: 50% + 400px
  // Table view: PlayerTables is 1057px wide, positioned at left: 50%, transform: translateX(-50%)
  //   Right edge is at: 50% + 528.5px (1057px / 2)
  // Draft view: PlayByPlay right edge aligns with MainContainer right edge at 50% + 503px (1006px / 2)
  const rightEdgeOffset = viewMode === 'list' ? 400 : viewMode === 'draft' ? 503 : 528.5;

  return (
    <div
      style={{
        position: 'absolute',
        right: '50%',
        top: '184px',
        width: '400px',
        height: '48px',
        zIndex: 1000,
        transform: `translateX(${rightEdgeOffset}px)`, // Right edge aligns with PlayerCards or PlayerTables
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: '#1F1F1F',
        borderTop: '1px solid #404040',
        borderBottom: '1px solid #404040',
        borderLeft: 'none',
        borderRight: 'none',
      }}
    >
      <p
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 800,
          fontSize: '12px',
          lineHeight: 'normal',
          color: '#ffffff',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
        }}
      >
        {name} (Par {par}) - {location}
      </p>
    </div>
  );
}
