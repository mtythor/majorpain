'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OneSignal from 'react-onesignal';
import { ChevronLeft } from 'lucide-react';
import { useNotificationDiagnostics } from '@/hooks/useNotificationDiagnostics';

const SUBSCRIBE_TIMEOUT_MS = 10000;

/** Wait for OneSignal to assign a subscription ID (proof it reached their servers). */
function waitForSubscriptionId(timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    const sub = OneSignal.User?.PushSubscription;
    if (!sub) {
      resolve(null);
      return;
    }
    if (sub.id) {
      resolve(sub.id);
      return;
    }
    const handler = () => {
      if (sub.id) {
        sub.removeEventListener('change', handler);
        clearTimeout(timer);
        resolve(sub.id);
      }
    };
    sub.addEventListener('change', handler);
    const timer = setTimeout(() => {
      sub.removeEventListener('change', handler);
      resolve(sub.id ?? null);
    }, timeoutMs);
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { log, appendLog, initStatus, nativePermission, optedIn } = useNotificationDiagnostics();
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

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
    if (initStatus !== 'ready') {
      appendLog('OneSignal not ready yet. Wait a moment.', 'error');
      return;
    }
    if (optedIn === true) {
      appendLog('Already subscribed.');
      return;
    }
    setShowPromptModal(true);
  };

  const handlePromptAllow = async () => {
    setSubscribing(true);
    appendLog('Requesting permission and opting in...');
    try {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        appendLog('Requesting OneSignal permission...');
        await OneSignal.Notifications.requestPermission();
      }
      appendLog('Opting in to OneSignal...');
      await OneSignal.User.PushSubscription.optIn();
      const id = await waitForSubscriptionId(SUBSCRIBE_TIMEOUT_MS);
      if (id) {
        appendLog(`Subscribed successfully! (ID: ${id.slice(0, 8)}...)`);
        setShowPromptModal(false);
      } else {
        appendLog('Subscription may not have completed. Check OneSignal dashboard.', 'error');
      }
    } catch (e) {
      appendLog(`Error: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
    setSubscribing(false);
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
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        <button
          onClick={handleEnableNative}
          disabled={nativePermission === 'granted'}
          style={{
            padding: '14px 20px',
            backgroundColor: nativePermission === 'granted' ? '#333' : '#262626',
            border: '1px solid #444',
            borderRadius: 8,
            color: '#fff',
            cursor: nativePermission === 'granted' ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          1. Enable Native Notifications
          {nativePermission === 'granted' && ' (Done)'}
        </button>

        <button
          onClick={handleSubscribeClick}
          disabled={initStatus !== 'ready' || optedIn === true}
          style={{
            padding: '14px 20px',
            backgroundColor: initStatus === 'ready' && optedIn !== true ? '#fdc71c' : '#333',
            border: 'none',
            borderRadius: 8,
            color: initStatus === 'ready' && optedIn !== true ? '#000' : '#888',
            cursor: initStatus === 'ready' && optedIn !== true ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          2. Subscribe to Major Pain Notifications
          {optedIn === true && ' (Subscribed)'}
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
