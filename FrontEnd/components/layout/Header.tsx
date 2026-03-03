'use client';

import { ViewMode, TableViewMode, Player } from '@/lib/types';
import NavBar from '../navigation/NavBar';
import Logo from '../ui/Logo';
import ViewToggle from '../navigation/ViewToggle';
import ProfilePicture from '../ui/ProfilePicture';
import Stripe from '../ui/Stripe';
import Divider from '../ui/Divider';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface HeaderProps {
  currentView: ViewMode;
  viewMode?: TableViewMode;
  userProfile?: Player;
  onViewChange?: (view: ViewMode) => void;
  onViewModeChange?: (mode: TableViewMode) => void;
}

export default function Header({
  currentView,
  viewMode = 'list',
  userProfile,
  onViewChange = () => {},
  onViewModeChange = () => {},
}: HeaderProps) {
  const isMobile = useIsMobile();

  // Mobile: design tokens for stripe positioning
  if (isMobile) {
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          padding: 0,
          zIndex: 10,
          overflow: 'visible',
        }}
      >
        {/* Logo centered at top - uses CSS for viewport-based scaling */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translateX(-50%)',
            flexShrink: 0,
          }}
        >
          <Logo className="header-logo" size={{ width: 140, height: 97 }} />
        </div>
        {/* Left stripe */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - var(--stripe-offset))',
            top: 'var(--stripe-top)',
            transform: 'translateX(-50%)',
            width: 'var(--stripe-width)',
            overflow: 'hidden',
          }}
        >
          <Stripe width="100%" compact />
        </div>
        {/* Right stripe */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% + var(--stripe-offset))',
            top: 'var(--stripe-top)',
            transform: 'translateX(-50%)',
            width: 'var(--stripe-width)',
            overflow: 'hidden',
          }}
        >
          <Stripe width="100%" compact />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        gap: '9px',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        left: 0,
        top: 0,
        width: '100%',
        padding: 0,
        zIndex: 10,
      }}
    >
      {/* Header Left Side */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '29px',
          height: '97px',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          paddingTop: '8px',
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          position: 'relative',
          flex: '1 1 0',
          minWidth: '595px',
          maxWidth: 'calc(50% - 120px)',
        }}
      >
        <NavBar currentView={currentView} onViewChange={onViewChange} userProfile={userProfile} />
        <Stripe />
      </div>

      {/* Center Logo - header-logo class shrinks on mobile via globals.css */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          flexShrink: 0,
        }}
      >
        <Logo className="header-logo" />
      </div>

      {/* Header Right Side */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '25px',
          height: '97px',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          paddingTop: '8px',
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          position: 'relative',
          flex: '1 1 0',
          minWidth: '595px',
          maxWidth: 'calc(50% - 120px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            height: '40px',
            paddingLeft: 0,
            paddingRight: '16px',
            paddingTop: 0,
            paddingBottom: 0,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {currentView === 'tournament' && (
            <>
              <ViewToggle currentView={viewMode} onViewChange={onViewModeChange} />
              <Divider />
            </>
          )}
          {userProfile && (
            <ProfilePicture
              src={userProfile.imageUrl}
              alt={userProfile.name}
              size={32}
            />
          )}
        </div>
        <Stripe />
      </div>
    </div>
  );
}
