'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OneSignal from 'react-onesignal';
import { ChevronLeft } from 'lucide-react';
import { useNotificationDiagnostics } from '@/hooks/useNotificationDiagnostics';
import { isDevNotificationsTest } from '@/lib/notifications-dev';
import { onesignalInit } from '@/lib/onesignal-init';

const INIT_WAIT_MS = 15000;

function waitForInit(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (onesignalInit.status === 'ready') {
      resolve(true);
      return;
    }
    if (onesignalInit.status === 'failed' || onesignalInit.status === 'unavailable') {
      resolve(false);
      return;
    }
    const start = Date.now();
    const check = () => {
      if (onesignalInit.status === 'ready') {
        resolve(true);
        return;
      }
      if (onesignalInit.status === 'failed' || onesignalInit.status === 'unavailable') {
        resolve(false);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, 200);
    };
    check();
  });
}

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { log, appendLog, initStatus, initError, nativePermission, optedIn } = useNotificationDiagnostics();
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnableNative = async () => {
    appendLog('Requesting native notification permission...');
    try {
      if (typeof Notification === 'undefined') {
        appendLog('Notification API not available', 'error');
        return;
      }
      const perm = await Notification.requestPermission();
      appendLog(`Native permission: ${perm}`);
    } catch (e) {
      appendLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const handleSubscribeClick = () => {
    if (!isDevNotificationsTest() && initStatus !== 'ready') {
      appendLog('OneSignal not ready yet. Wait a moment.', 'error');
      return;
    }
    if (optedIn === true) {
      appendLog('Already subscribed.');
      return;
    }
    if (initStatus !== 'ready') {
      appendLog('OneSignal not ready yet - attempting anyway (dev test).', 'info');
    }
    setShowPromptModal(true);
  };

  const handlePromptAllow = async () => {
    setSubscribing(true);
    appendLog('Starting subscription...');
    try {
      if (onesignalInit.status !== 'ready') {
        const ready = await waitForInit(INIT_WAIT_MS);
        if (!ready) {
          appendLog('OneSignal did not initialize. Check connection.', 'error');
          setShowPromptModal(false);
          return;
        }
        appendLog('OneSignal ready.');
      }
      if (typeof Notification === 'undefined') {
        appendLog('Notifications not supported in this browser.', 'error');
        setShowPromptModal(false);
        return;
      }
      appendLog('Requesting permission via OneSignal...');
      await OneSignal.Notifications.requestPermission();
      if (!OneSignal.Notifications.permission) {
        appendLog('Permission denied.', 'error');
        setShowPromptModal(false);
        return;
      }
      appendLog('Permission granted. Subscribing to OneSignal...');
      const sub = OneSignal.User?.PushSubscription;
      if (!sub) {
        appendLog('PushSubscription not ready yet. Try again in a moment.', 'error');
        setShowPromptModal(false);
      } else {
        await sub.optIn();
        setShowPromptModal(false);
        appendLog('Subscribed.');
      }
    } catch (e) {
      appendLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error');
      setShowPromptModal(false);
    } finally {
      setSubscribing(false);
    }
  };

  const handlePromptNoThanks = () => {
    setShowPromptModal(false);
    appendLog('User declined.');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        color: '#fff',
        padding: 16,
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 24,
          background: 'none',
          border: 'none',
          color: '#3fa2ff',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
        Notification Settings
        {mounted && isDevNotificationsTest() && (
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: '#fdc71c', verticalAlign: 'middle' }}>
            (dev test)
          </span>
        )}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        <button
          onClick={handleEnableNative}
          disabled={!mounted ? false : nativePermission === 'granted'}
          style={{
            padding: '14px 20px',
            backgroundColor: !mounted ? '#262626' : nativePermission === 'granted' ? '#333' : '#262626',
            border: '1px solid #444',
            borderRadius: 8,
            color: '#fff',
            cursor: !mounted ? 'pointer' : nativePermission === 'granted' ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          1. Enable Native Notifications
          {mounted && nativePermission === 'granted' && ' (Done)'}
        </button>

        <button
          onClick={handleSubscribeClick}
          disabled={!mounted ? true : optedIn === true || (!isDevNotificationsTest() && initStatus !== 'ready')}
          style={{
            padding: '14px 20px',
            backgroundColor: !mounted ? '#333' : optedIn !== true && (isDevNotificationsTest() || initStatus === 'ready') ? '#fdc71c' : '#333',
            border: 'none',
            borderRadius: 8,
            color: !mounted ? '#888' : optedIn !== true && (isDevNotificationsTest() || initStatus === 'ready') ? '#000' : '#888',
            cursor: !mounted ? 'not-allowed' : optedIn !== true && (isDevNotificationsTest() || initStatus === 'ready') ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          2. Subscribe to Major Pain Notifications
          {mounted && optedIn === true && ' (Subscribed)'}
        </button>
      </div>

      <div
        style={{
          padding: 12,
          backgroundColor: '#141414',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'monospace',
          maxHeight: 200,
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: 8, color: '#888' }}>Activity Log</div>
        <div>Init: {initStatus} | Native: {nativePermission} | Opted in: {String(optedIn)}</div>
        {initStatus === 'failed' && initError && (
          <div style={{ marginTop: 4, color: '#e12c55', fontSize: 11 }}>
            OneSignal init error: {initError}
          </div>
        )}
        {log.slice(-10).map((entry, i) => (
          <div
            key={i}
            style={{
              marginTop: 4,
              color: entry.type === 'error' ? '#e12c55' : '#888',
            }}
          >
            {entry.message}
          </div>
        ))}
      </div>

      {showPromptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#262626',
              borderRadius: 12,
              padding: 24,
              maxWidth: 360,
              width: '100%',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>
              Enable Push Notifications?
            </h3>
            <p style={{ margin: '0 0 20px', color: '#aaa', fontSize: 14 }}>
              Get notified when it&apos;s your turn to draft, when day results are in, and more.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={handlePromptNoThanks}
                disabled={subscribing}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #555',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: subscribing ? 'not-allowed' : 'pointer',
                }}
              >
                No Thanks
              </button>
              <button
                onClick={handlePromptAllow}
                disabled={subscribing}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fdc71c',
                  border: 'none',
                  borderRadius: 8,
                  color: '#000',
                  fontWeight: 600,
                  cursor: subscribing ? 'not-allowed' : 'pointer',
                }}
              >
                {subscribing ? 'Subscribing...' : 'Allow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
