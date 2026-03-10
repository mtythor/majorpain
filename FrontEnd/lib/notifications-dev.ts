/**
 * Dev-only helpers for testing OneSignal without a real mobile device.
 * Activates when: dev mode + (URL has ?notifications_test OR env var OR viewport ≤1024px).
 * Viewport check covers DevTools device emulator and resized windows.
 */

const DEV_TEST_VIEWPORT_MAX = 1024;

export function isDevNotificationsTest(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV !== 'development') return false;
  const hasParam = new URLSearchParams(window.location.search).has('notifications_test');
  const hasEnv = process.env.NEXT_PUBLIC_NOTIFICATIONS_DEV_TEST === 'true';
  const narrowViewport = window.innerWidth <= DEV_TEST_VIEWPORT_MAX;
  return hasParam || hasEnv || narrowViewport;
}
