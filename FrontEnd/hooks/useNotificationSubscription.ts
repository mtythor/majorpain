'use client';

import { useState, useEffect, useCallback } from 'react';
import { onesignalInit } from '@/lib/onesignal-init';

const POLL_MS = 200;
const POLL_MAX_MS = 3000;
const RECHECK_DELAY_MS = 800;

/**
 * Returns subscription state for banner visibility.
 * Polls for OneSignal since init is async and state can lag (IndexedDB sync).
 */
export function useNotificationSubscription(isMobile: boolean) {
  const [optedIn, setOptedIn] = useState<boolean | null>(null);

  const updateOptedIn = useCallback(() => {
    const os = typeof window !== 'undefined' ? (window as unknown as { OneSignal?: { User?: { PushSubscription?: { optedIn?: boolean } } } }).OneSignal : undefined;
    if (!os?.User?.PushSubscription) return false;
    const sub = os.User.PushSubscription;
    const opted = sub.optedIn === true || (typeof Notification !== 'undefined' && Notification.permission === 'granted');
    setOptedIn(opted);
    return opted;
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
    if (!appId || onesignalInit.status === 'unavailable') {
      setOptedIn(false);
      return;
    }

    let pollCount = 0;
    const maxPolls = POLL_MAX_MS / POLL_MS;

    let timeoutId: ReturnType<typeof setTimeout>;
    let changeHandler: (() => void) | undefined;

    const poll = () => {
      pollCount++;
      if (onesignalInit.status === 'ready') {
        const os = (window as unknown as { OneSignal?: { User?: { PushSubscription?: { optedIn?: boolean; addEventListener: (e: string, h: () => void) => void; removeEventListener: (e: string, h: () => void) => void } } } }).OneSignal;
        const sub = os?.User?.PushSubscription;
        if (sub) {
          const opts = () => {
            const next = sub.optedIn === true || (typeof Notification !== 'undefined' && Notification.permission === 'granted');
            setOptedIn(next);
          };
          opts();
          changeHandler = opts;
          sub.addEventListener('change', changeHandler);
          if (pollCount === 1) {
            timeoutId = setTimeout(updateOptedIn, RECHECK_DELAY_MS);
          }
          return;
        }
      }
      if (pollCount < maxPolls) {
        timeoutId = setTimeout(poll, POLL_MS);
      } else {
        setOptedIn(false);
      }
    };

    poll();

    return () => {
      clearTimeout(timeoutId);
      const os = (window as unknown as { OneSignal?: { User?: { PushSubscription?: { removeEventListener: (e: string, h: () => void) => void } } } }).OneSignal;
      const sub = os?.User?.PushSubscription;
      if (sub && changeHandler) {
        sub.removeEventListener('change', changeHandler);
      }
    };
  }, [isMobile, updateOptedIn]);

  const hasOneSignal = !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() && onesignalInit.status !== 'unavailable';

  return { optedIn, hasOneSignal };
}
