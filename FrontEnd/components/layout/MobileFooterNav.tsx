'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getTournaments } from '@/lib/data';

export default function MobileFooterNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const isDraftPage = pathname?.startsWith('/draft');
  const showFooter =
    isMobile &&
    (pathname?.startsWith('/season') ||
      pathname?.startsWith('/tournament') ||
      isDraftPage ||
      pathname?.startsWith('/admin'));

  // On draft page: Draft | Play-by-Play. Else: Tournament | Season
  const currentDraftPanel = searchParams?.get('panel') === 'play-by-play' ? 'play-by-play' : 'draft';
  const currentView = pathname?.startsWith('/season') ? 'season' : 'tournament';

  const handleDraftPanel = (panel: 'draft' | 'play-by-play') => {
    if (currentDraftPanel === panel) return;
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('panel', panel);
    const query = params.toString();
    router.push(`/draft${query ? `?${query}` : ''}`);
  };

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
      className={`mobile-footer-nav${showFooter ? ' mobile-footer-nav-visible' : ''}`}
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
        ...(showFooter && {
          position: 'fixed' as const,
          bottom: 0,
          left: 0,
          right: 0,
        }),
      }}
    >
      {isDraftPage ? (
        <>
          <button
            onClick={() => handleDraftPanel('draft')}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: currentDraftPanel === 'draft' ? '#262626' : 'rgba(0,0,0,0.5)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(13px, 3.5vw, 16px)',
              color: currentDraftPanel === 'draft' ? '#fdc71c' : '#ffffff',
              padding: '14px 12px',
            }}
            aria-pressed={currentDraftPanel === 'draft'}
          >
            Draft
          </button>
          <button
            onClick={() => handleDraftPanel('play-by-play')}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: currentDraftPanel === 'play-by-play' ? '#262626' : 'rgba(0,0,0,0.5)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(13px, 3.5vw, 16px)',
              color: currentDraftPanel === 'play-by-play' ? '#fdc71c' : '#ffffff',
              padding: '14px 12px',
            }}
            aria-pressed={currentDraftPanel === 'play-by-play'}
          >
            Play-by-Play
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
