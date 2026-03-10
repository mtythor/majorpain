'use client';

import { useState, useEffect, useCallback } from 'react';
import OneSignal from 'react-onesignal';
import { onesignalInit } from '@/lib/onesignal-init';
import { isDevNotificationsTest } from '@/lib/notifications-dev';

export interface LogEntry {
  message: string;
  type: 'info' | 'error';
  at: Date;
}

const POLL_MS = 500;

export function useNotificationDiagnostics() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [initStatus, setInitStatus] = useState(onesignalInit.status);
  const [initError, setInitError] = useState<string | null>(onesignalInit.error);
  const [nativePermission, setNativePermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [optedIn, setOptedIn] = useState<boolean | undefined>(undefined);

  const appendLog = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setLog((prev) => [...prev.slice(-50), { message, type, at: new Date() }]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setInitStatus(onesignalInit.status);
      setInitError(onesignalInit.error);
      if (isDevNotificationsTest()) {
        setNativePermission('granted');
      } else if (typeof Notification !== 'undefined') {
        setNativePermission(Notification.permission);
      }
      const sub = (window as unknown as { OneSignal?: typeof OneSignal }).OneSignal?.User?.PushSubscription;
      // Only treat as subscribed when we have a subscription ID (reached OneSignal's servers)
      const actuallySubscribed = !!(sub?.optedIn && sub?.id);
      setOptedIn(actuallySubscribed);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return { log, appendLog, initStatus, initError, nativePermission, optedIn };
}
