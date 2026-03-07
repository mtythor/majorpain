'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Tournament } from '@/lib/types';
import { PICKER_OFFSETS } from '@/lib/design-tokens';

interface TournamentPickerProps {
  tournaments: Tournament[];
  selectedTournament: Tournament;
  onSelect: (tournament: Tournament) => void;
  viewMode?: 'list' | 'table' | 'draft';
}

export default function TournamentPicker({
  tournaments,
  selectedTournament,
  onSelect,
  viewMode = 'list',
}: TournamentPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const leftEdgeOffset = viewMode === 'list' ? PICKER_OFFSETS.list : viewMode === 'draft' ? PICKER_OFFSETS.draft : PICKER_OFFSETS.table;

  return (
    <div
      ref={pickerRef}
      className="tournament-picker"
      data-view-mode={viewMode}
      style={
        {
          '--picker-offset': `-${leftEdgeOffset}px`,
        } as React.CSSProperties
      }
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          backgroundColor: '#262626',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
          left: 0,
          padding: '8px',
          borderRadius: isOpen ? '4px 4px 0 0' : '4px',
          top: '0.5px',
          width: '100%',
          cursor: 'pointer',
          zIndex: 1001,
        }}
      >
        <div
          style={{
            height: '24px',
            position: 'relative',
            flexShrink: 0,
            width: '17px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <Image
              src="/images/icon_golfer.png"
              alt="Golfer Icon"
              width={17}
              height={24}
              style={{
                position: 'absolute',
                height: '188.24%',
                left: '-75%',
                maxWidth: 'none',
                top: '-44.12%',
                width: '266.67%',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0,
            flex: 1,
          }}
        >
          <p
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 800,
              fontSize: '12px',
              lineHeight: 'normal',
              fontStyle: 'normal',
              position: 'relative',
              flexShrink: 0,
              color: '#ffffff',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedTournament.name}
          </p>
          <p
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: 'normal',
              fontStyle: 'normal',
              position: 'relative',
              flexShrink: 0,
              color: '#ffffff',
            }}
          >
            {selectedTournament.dateRange}
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
          {isOpen ? (
            <ChevronUp size={10} color="#ffffff" />
          ) : (
            <ChevronDown size={10} color="#ffffff" />
          )}
        </div>
      </div>

      {isOpen && (
        <div
          className="tournament-picker-dropdown"
          style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            right: 0,
            backgroundColor: '#262626',
            borderRadius: '0 0 4px 4px',
            borderTop: '1px solid #323232',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              onClick={() => {
                onSelect(tournament);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor:
                  tournament.id === selectedTournament.id ? '#1f1f1f' : 'transparent',
                color: '#ffffff',
                fontFamily: "'Open Sans', sans-serif",
                fontSize: '12px',
                fontWeight: tournament.id === selectedTournament.id ? 800 : 400,
              }}
              onMouseEnter={(e) => {
                if (tournament.id !== selectedTournament.id) {
                  e.currentTarget.style.backgroundColor = '#1f1f1f';
                }
              }}
              onMouseLeave={(e) => {
                if (tournament.id !== selectedTournament.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>
                {tournament.name}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>{tournament.dateRange}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
