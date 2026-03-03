'use client';

import { useIsMobile } from '@/hooks/useMediaQuery';

interface SeasonPickerProps {
  season: string;
  onSelect?: () => void;
}

export default function SeasonPicker({ season, onSelect }: SeasonPickerProps) {
  const isMobile = useIsMobile();

  return (
    <div
      onClick={onSelect}
      style={{
        position: 'absolute',
        backgroundColor: '#262626',
        display: 'flex',
        gap: '16px',
        height: '48px',
        alignItems: 'center',
        left: isMobile ? 0 : 'calc(50% - 1255px / 2)',
        right: isMobile ? 0 : undefined,
        padding: '8px',
        borderRadius: '4px',
        top: isMobile ? '160px' : '147px',
        width: isMobile ? undefined : '246px',
        zIndex: 1000,
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
        <i className="fa-solid fa-trophy" style={{ fontSize: '18px', color: '#ffffff' }} />
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
        <i className="fa-solid fa-caret-down" style={{ fontSize: '10px', color: '#ffffff' }} />
      </div>
    </div>
  );
}
