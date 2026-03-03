'use client';

import { useEffect } from 'react';

/**
 * Loads Font Awesome asynchronously to avoid blocking initial render.
 * Uses the media="print" onload="this.media='all'" pattern for non-blocking load.
 */
export default function FontAwesomeLoader() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    link.integrity =
      'sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==';
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';
    document.head.appendChild(link);
  }, []);

  return null;
}
