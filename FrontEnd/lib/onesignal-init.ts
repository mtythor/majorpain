import OneSignal from 'react-onesignal';

/**
 * OneSignal init status - updated by OneSignalProvider when init completes.
 * Used by hooks and Notifications page for subscription state and diagnostics.
 */
export const onesignalInit = {
  status: 'pending' as 'pending' | 'ready' | 'failed' | 'unavailable',
  error: null as string | null,
  setReady() {
    this.status = 'ready';
    this.error = null;
  },
  setFailed(err: unknown) {
    this.status = 'failed';
    this.error = err instanceof Error ? err.message : String(err);
  },
  setUnavailable() {
    this.status = 'unavailable';
    this.error = 'NEXT_PUBLIC_ONESIGNAL_APP_ID not configured';
  },
};

/**
 * Call OneSignal.login only when the user has an active push subscription.
 * Calling login without a subscription causes a 400 Bad Request from OneSignal's API.
 */
export function tryOneSignalLogin(playerId: number): void {
  if (typeof window === 'undefined') return;
  if (onesignalInit.status !== 'ready') return;
  const sub = OneSignal.User?.PushSubscription;
  if (!sub?.optedIn || !sub?.id) return;
  OneSignal.login(String(playerId)).catch(() => {});
}
