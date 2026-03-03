'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getTournaments } from '@/lib/data';

export default function MobileFooterNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const showFooter =
    pathname?.startsWith('/season') ||
    pathname?.startsWith('/tournament') ||
    pathname?.startsWith('/draft') ||
    pathname?.startsWith('/admin');

  if (!showFooter) return null;

  const currentView = pathname?.startsWith('/season') ? 'season' : 'tournament';

  const handleTournament = () => {
    if (currentView === 'tournament') return;
    const tournaments = getTournaments();
    const firstId = tournaments[0]?.id;
    if (firstId) {
      router.push(`/tournament/${firstId}/list`);
    } else {
      router.push('/season');
    }
  };

  const handleSeason = () => {
    if (currentView === 'season') return;
    router.push('/season');
  };

  return (
    <div
      className="mobile-footer-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        zIndex: 1000,
        backgroundColor: '#0f0f0f',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <button
        onClick={handleTournament}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentView === 'tournament' ? '#262626' : 'rgba(0,0,0,0.5)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 800,
          fontSize: '12px',
          color: currentView === 'tournament' ? '#fdc71c' : '#ffffff',
          padding: '12px 8px',
        }}
        aria-pressed={currentView === 'tournament'}
      >
        TOURNAMENT
      </button>
      <button
        onClick={handleSeason}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentView === 'season' ? '#262626' : 'rgba(0,0,0,0.5)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 800,
          fontSize: '12px',
          color: currentView === 'season' ? '#fdc71c' : '#ffffff',
          padding: '12px 8px',
        }}
        aria-pressed={currentView === 'season'}
      >
        SEASON
      </button>
    </div>
  );
}
