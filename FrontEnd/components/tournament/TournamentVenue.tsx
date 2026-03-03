'use client';

import { Tournament } from '@/lib/types';
import { PICKER_OFFSETS } from '@/lib/design-tokens';

interface TournamentVenueProps {
  tournament: Tournament;
  viewMode: 'list' | 'table' | 'draft';
}

export default function TournamentVenue({ tournament, viewMode }: TournamentVenueProps) {
  if (!tournament.venue) {
    return null;
  }

  const { name, par, location } = tournament.venue;

  const contentHalfWidth = viewMode === 'list' ? PICKER_OFFSETS.list : viewMode === 'draft' ? PICKER_OFFSETS.draft : PICKER_OFFSETS.table;

  return (
    <div
      style={{
        position: 'absolute',
        right: '50%',
        top: '168px', // Same row as tournament picker on desktop
        width: '360px',
        height: 'var(--picker-height)',
        zIndex: 1000,
        transform: `translateX(${contentHalfWidth}px)`, // Right edge aligns with page content right edge
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
