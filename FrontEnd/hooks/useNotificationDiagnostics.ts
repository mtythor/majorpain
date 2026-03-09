'use client';

import { useState, useEffect, useCallback } from 'react';
import OneSignal from 'react-onesignal';
import { onesignalInit } from '@/lib/onesignal-init';

export interface LogEntry {
  message: string;
  type: 'info' | 'error';
  at: Date;
}

const POLL_MS = 500;

export function useNotificationDiagnostics() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [initStatus, setInitStatus] = useState(onesignalInit.status);
  const [nativePermission, setNativePermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [optedIn, setOptedIn] = useState<boolean | undefined>(undefined);

  const appendLog = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setLog((prev) => [...prev.slice(-50), { message, type, at: new Date() }]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setInitStatus(onesignalInit.status);
      if (typeof Notification !== 'undefined') {
        setNativePermission(Notification.permission);
      }
      const sub = (window as unknown as { OneSignal?: typeof OneSignal }).OneSignal?.User?.PushSubscription;
      setOptedIn(sub?.optedIn);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return { log, appendLog, initStatus, nativePermission, optedIn };
}
