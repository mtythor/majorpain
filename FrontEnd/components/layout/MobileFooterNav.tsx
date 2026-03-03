'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getTournaments } from '@/lib/data';

export default function MobileFooterNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const showFooter =
    isMobile &&
    (pathname?.startsWith('/season') ||
      pathname?.startsWith('/tournament') ||
      pathname?.startsWith('/draft') ||
      pathname?.startsWith('/admin'));

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
        display: showFooter ? 'flex' : 'none',
        width: '100%',
        maxWidth: '100%',
        flexShrink: 0,
        backgroundColor: '#0f0f0f',
        borderTop: '4px solid #0E0E0E',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        boxSizing: 'border-box',
      }}
    >
      <button
        onClick={handleTournament}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentView === 'tournament' ? '#262626' : 'rgba(0,0,0,0.5)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(13px, 3.5vw, 16px)',
          color: currentView === 'tournament' ? '#fdc71c' : '#ffffff',
          padding: '14px 12px',
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
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentView === 'season' ? '#262626' : 'rgba(0,0,0,0.5)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(13px, 3.5vw, 16px)',
          color: currentView === 'season' ? '#fdc71c' : '#ffffff',
          padding: '14px 12px',
        }}
        aria-pressed={currentView === 'season'}
      >
        SEASON
      </button>
    </div>
  );
}
