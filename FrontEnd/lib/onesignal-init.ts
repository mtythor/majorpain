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
