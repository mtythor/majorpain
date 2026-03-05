'use client';

import { ViewMode, Player } from '@/lib/types';
import NavButton from './NavButton';

interface NavBarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  userProfile?: Player | null;
}

export default function NavBar({ currentView, onViewChange }: NavBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        paddingLeft: '16px',
        paddingRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <NavButton
        label="TOURNAMENT"
        isSelected={currentView === 'tournament'}
        onClick={() => onViewChange('tournament')}
      />
      <NavButton
        label="SEASON"
        isSelected={currentView === 'season'}
        onClick={() => onViewChange('season')}
      />
    </div>
  );
}
