'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Trophy, ChartLine, SquareCheck, ListOrdered } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getTournaments, getCurrentUser } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import IdentityMenu from '@/components/auth/IdentityMenu';

const ICON_SIZE = 22;

export default function MobileFooterNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  const userProfile = getCurrentUser();

  const isDraftPage = pathname?.startsWith('/draft');
  const showFooter =
    isMobile &&
    (pathname?.startsWith('/season') ||
      pathname?.startsWith('/tournament') ||
      isDraftPage ||
      pathname?.startsWith('/admin'));

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

  const navButtonStyle = {
    minHeight: 52,
    minWidth: 56,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
    padding: '0 12px',
    border: 'none' as const,
    cursor: 'pointer' as const,
    backgroundColor: 'transparent',
  };

  const labelStyle = (active: boolean) => ({
    fontFamily: "'Open Sans', sans-serif" as const,
    fontWeight: 500 as const,
    fontSize: 10,
    lineHeight: 1,
    color: active ? '#fdc71c' : '#ffffff',
    margin: 0,
  });

  if (!showFooter) return null;

  return (
    <div
      className="mobile-footer-nav mobile-footer-nav-visible"
      style={{
        display: 'flex',
        width: '100%',
        maxWidth: '100%',
        flexShrink: 0,
        alignItems: 'center',
        backgroundColor: '#0f0f0f',
        borderTop: '4px solid #0E0E0E',
        paddingTop: 6,
        paddingBottom: 'max(6px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        boxSizing: 'border-box',
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
          gap: 20,
          alignItems: 'center',
        }}
      >
        {isDraftPage ? (
          <>
            <button
              onClick={() => handleDraftPanel('draft')}
              style={navButtonStyle}
              aria-label="Draft"
              aria-pressed={currentDraftPanel === 'draft'}
            >
              <SquareCheck
                size={ICON_SIZE}
                color={currentDraftPanel === 'draft' ? '#fdc71c' : '#ffffff'}
              />
              <span style={labelStyle(currentDraftPanel === 'draft')}>Draft</span>
            </button>
            <button
              onClick={() => handleDraftPanel('play-by-play')}
              style={navButtonStyle}
              aria-label="Play-by-play"
              aria-pressed={currentDraftPanel === 'play-by-play'}
            >
              <ListOrdered
                size={ICON_SIZE}
                color={currentDraftPanel === 'play-by-play' ? '#fdc71c' : '#ffffff'}
              />
              <span style={labelStyle(currentDraftPanel === 'play-by-play')}>Play-by-Play</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleTournament}
              style={navButtonStyle}
              aria-label="Tournament"
              aria-pressed={currentView === 'tournament'}
            >
              <Trophy
                size={ICON_SIZE}
                color={currentView === 'tournament' ? '#fdc71c' : '#ffffff'}
              />
              <span style={labelStyle(currentView === 'tournament')}>Tournament</span>
            </button>
            <button
              onClick={handleSeason}
              style={navButtonStyle}
              aria-label="Season"
              aria-pressed={currentView === 'season'}
            >
              <ChartLine
                size={ICON_SIZE}
                color={currentView === 'season' ? '#fdc71c' : '#ffffff'}
              />
              <span style={labelStyle(currentView === 'season')}>Season</span>
            </button>
          </>
        )}
        {currentUser && userProfile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 56 }}>
            <IdentityMenu userProfile={userProfile} variant="nav" />
          </div>
        )}
      </div>
    </div>
  );
}
