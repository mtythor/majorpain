'use client';

import { useSyncExternalStore, useCallback } from 'react';

const MOBILE_BREAKPOINT = '(max-width: 767px)';

/**
 * Hook to detect if viewport matches a media query.
 * Uses useSyncExternalStore for reliable, synchronous updates on resize -
 * avoids "stuck" layout and tearing that can occur with useState + useEffect.
 * Fires immediately on mount and on every viewport change (resize, orientation).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const media = window.matchMedia(query);
      media.addEventListener('change', onStoreChange);
      window.addEventListener('orientationchange', onStoreChange);
      return () => {
        media.removeEventListener('change', onStoreChange);
        window.removeEventListener('orientationchange', onStoreChange);
      };
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** true when viewport is below md (768px) - mobile layout */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_BREAKPOINT);
}
