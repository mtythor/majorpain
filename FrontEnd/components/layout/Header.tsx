'use client';

import { ViewMode, TableViewMode, Player } from '@/lib/types';
import NavBar from '../navigation/NavBar';
import Logo from '../ui/Logo';
import ViewToggle from '../navigation/ViewToggle';
import IdentityMenu from '../auth/IdentityMenu';
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

  // Logo dimensions: 140px mobile (per globals.css), 232px desktop. 4px gap each side.
  const logoHalfWidth = isMobile ? 70 : 116;
  const stripeGap = 4;
  const stripeTop = isMobile ? 47 : 73;

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
      {/* Stripes - from screen edges to logo edges, behind everything */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: stripeTop,
          width: `calc(50% - ${logoHalfWidth}px - ${stripeGap}px)`,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <Stripe width="100%" compact={isMobile} />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: stripeTop,
          width: `calc(50% - ${logoHalfWidth}px - ${stripeGap}px)`,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <Stripe width="100%" compact={isMobile} />
      </div>
      {/* Logo centered on top of stripes */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          transform: 'translateX(-50%)',
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <Logo
          className="header-logo"
          size={isMobile ? { width: 140, height: 97 } : { width: 232, height: 160 }}
        />
      </div>
      {/* Mobile: ViewToggle left, avatar right, no divider */}
      {isMobile && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'flex',
              alignItems: 'center',
              paddingTop: 6,
              paddingLeft: 16,
              zIndex: 2,
            }}
          >
            {currentView === 'tournament' && (
              <ViewToggle currentView={viewMode} onViewChange={onViewModeChange} />
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              display: 'flex',
              alignItems: 'center',
              paddingTop: 6,
              paddingRight: 16,
              zIndex: 2,
            }}
          >
            {userProfile && (
              <IdentityMenu userProfile={userProfile} compact />
            )}
          </div>
        </>
      )}
      {/* Desktop: NavBar and right-side controls above the stripes */}
      {!isMobile && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '29px',
              height: stripeTop,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              paddingTop: '16px',
              paddingLeft: 0,
              maxWidth: 'calc(50% - 120px)',
              zIndex: 2,
            }}
          >
            <NavBar currentView={currentView} onViewChange={onViewChange} userProfile={userProfile} />
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '25px',
              height: stripeTop,
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
              paddingTop: '16px',
              paddingRight: '16px',
              maxWidth: 'calc(50% - 120px)',
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                height: '40px',
              }}
            >
              {currentView === 'tournament' && (
                <>
                  <ViewToggle currentView={viewMode} onViewChange={onViewModeChange} />
                  <Divider />
                </>
              )}
              {userProfile && (
                <IdentityMenu userProfile={userProfile} compact />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
