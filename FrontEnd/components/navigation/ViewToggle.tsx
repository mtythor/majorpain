'use client';

import { TableViewMode } from '@/lib/types';

interface ViewToggleProps {
  currentView: TableViewMode;
  onViewChange: (view: TableViewMode) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div
      style={{
        height: '34px',
        position: 'relative',
        flexShrink: 0,
        width: '72px',
      }}
    >
      <button
        onClick={() => onViewChange('list')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          position: 'absolute',
          borderRadius: '4px',
          top: 0,
          cursor: 'pointer',
          backgroundColor: currentView === 'list' ? '#262626' : 'transparent',
          left: 0,
          border: 'none',
        }}
      >
        <i
          className="fa-solid fa-bars"
          style={{
            fontSize: '18px',
            lineHeight: 'normal',
            position: 'relative',
            flexShrink: 0,
            color: currentView === 'list' ? '#fdc71c' : '#ffffff',
          }}
        />
      </button>
      <button
        onClick={() => onViewChange('table')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          position: 'absolute',
          borderRadius: '4px',
          top: 0,
          cursor: 'pointer',
          backgroundColor: currentView === 'table' ? '#262626' : 'transparent',
          left: '40px',
          border: 'none',
        }}
      >
        <i
          className="fa-solid fa-grip"
          style={{
            fontSize: '18px',
            lineHeight: 'normal',
            position: 'relative',
            flexShrink: 0,
            color: currentView === 'table' ? '#fdc71c' : '#ffffff',
          }}
        />
      </button>
    </div>
  );
}
