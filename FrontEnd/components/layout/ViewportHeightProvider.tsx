'use client';

import { useEffect } from 'react';

/**
 * Sets --vvh (visual viewport height) CSS variable for reliable full-height layouts
 * in PWA and mobile, where 100vh/100dvh can report incorrect values.
 */
export default function ViewportHeightProvider() {
  useEffect(() => {
    const setVvh = () => {
      const h =
        typeof window !== 'undefined' && window.visualViewport
          ? window.visualViewport.height
          : typeof window !== 'undefined'
            ? window.innerHeight
            : null;
      if (h != null) {
        document.documentElement.style.setProperty('--vvh', `${Math.round(h)}px`);
      }
    };

    setVvh();
    window.visualViewport?.addEventListener('resize', setVvh);
    window.visualViewport?.addEventListener('scroll', setVvh);
    window.addEventListener('resize', setVvh);

    return () => {
      window.visualViewport?.removeEventListener('resize', setVvh);
      window.visualViewport?.removeEventListener('scroll', setVvh);
      window.removeEventListener('resize', setVvh);
    };
  }, []);

  return null;
}
