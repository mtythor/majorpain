'use client';

import { List, LayoutGrid } from 'lucide-react';
import { TableViewMode } from '@/lib/types';

interface ViewToggleProps {
  currentView: TableViewMode;
  onViewChange: (view: TableViewMode) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const iconColor = (active: boolean) => (active ? '#fdc71c' : '#ffffff');
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
        <List size={18} color={iconColor(currentView === 'list')} />
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
        <LayoutGrid size={18} color={iconColor(currentView === 'table')} />
      </button>
    </div>
  );
}
