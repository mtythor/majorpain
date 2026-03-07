'use client';

import { Trophy, ChevronDown } from 'lucide-react';

interface SeasonPickerProps {
  season: string;
  onSelect?: () => void;
}

export default function SeasonPicker({ season, onSelect }: SeasonPickerProps) {
  return (
    <div
      className="season-picker"
      onClick={onSelect}
      style={{
        backgroundColor: '#262626',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        padding: '8px',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          height: '24px',
          position: 'relative',
          flexShrink: 0,
          width: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Trophy size={18} color="#ffffff" />
      </div>
      <div
        style={{
          display: 'flex',
          flex: '1 0 0',
          minHeight: 0,
          minWidth: 0,
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <p
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 700,
            lineHeight: 'normal',
            fontStyle: 'normal',
            position: 'relative',
            flexShrink: 0,
            fontSize: '12px',
            color: '#ffffff',
            margin: 0,
          }}
        >
          {season}
        </p>
      </div>
      <div
        style={{
          height: '10px',
          position: 'relative',
          flexShrink: 0,
          width: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronDown size={10} color="#ffffff" />
      </div>
    </div>
  );
}
