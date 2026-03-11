# Push Notification Implementation Summary

This document summarizes how push notifications were finalized in this project, including native permission handling, OneSignal subscription management in the UI, and lessons learned. Use it as a guide for implementing push notifications in another project to avoid common headaches.

---

## Overview

- **Provider**: OneSignal (Web SDK v16)
- **Library**: `react-onesignal` v3.4.6
- **Approach**: Two-step flow—native browser permission first, then OneSignal subscription—with a **custom prompt** instead of OneSignal’s built-in Slidedown
- **Delivery**: Server-side sends via OneSignal REST API when app events occur (score updates, etc.)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLIENT (React + Vite)                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  main.jsx          → OneSignal.init() at app boot                            │
│  onesignalInit.js  → Status object (pending/ready/failed/unavailable)        │
│  useNotificationSubscription → optedIn state for banner (mobile only)        │
│  useNotificationDiagnostics  → Status + activity log for NotificationsPage    │
│  NotificationsPage → Two buttons + custom prompt modal + Activity log        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ OneSignal SDK registers subscription
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVER (Node/Express)                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  processNotifications() called after score/round saves                        │
│  notificationTriggers.js → Detects events (match complete, birdie, etc.)      │
│  notifications.js       → Sends via OneSignal REST API, persists sent keys   │
│  brocation_notification_state table → Tracks what’s been sent (no duplicates) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Client-Side Setup

### Dependencies

```json
"react-onesignal": "^3.4.6"
```

### Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_ONESIGNAL_APP_ID` | Client + Server | OneSignal App ID (Vite exposes `VITE_` vars to client) |
| `ONESIGNAL_REST_API_KEY` | Server only | REST API key for server-side sends |

### Service Worker

- **Path**: `public/push/OneSignalSDKWorker.js`
- **Content**: Single line:
  ```js
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
  ```
- Vite copies `public/` into `dist/`, so the worker is served at `/push/OneSignalSDKWorker.js`.
- OneSignal expects scope `/push/`—keep this path.

### Initialization (main.jsx)

```js
import OneSignal from 'react-onesignal'
import { onesignalInit } from './onesignalInit.js'

const appId = import.meta.env?.VITE_ONESIGNAL_APP_ID
if (appId) {
  OneSignal.init({
    appId,
    serviceWorkerPath: 'push/OneSignalSDKWorker.js',
    serviceWorkerParam: { scope: '/push/' },
    allowLocalhostAsSecureOrigin: true,
    // NO promptOptions - we use our own custom prompt
  })
    .then(() => onesignalInit.setReady())
    .catch((err) => onesignalInit.setFailed(err))
} else {
  onesignalInit.setUnavailable()
}
```

**Important:** Do not configure `promptOptions` or any auto-prompt. We use our own UI.

### Init Status Object (onesignalInit.js)

A simple mutable object that `main.jsx` updates when init completes:

```js
export const onesignalInit = {
  status: 'pending', // 'pending' | 'ready' | 'failed' | 'unavailable'
  error: null,
  setReady() { this.status = 'ready'; this.error = null; },
  setFailed(err) { this.status = 'failed'; this.error = err?.message ?? String(err); },
  setUnavailable() { this.status = 'unavailable'; this.error = 'VITE_ONESIGNAL_APP_ID not configured'; },
};
```

---

## 2. Native Permission vs OneSignal Subscription (Two Steps)

Web push requires two distinct steps:

1. **Native permission**: `Notification.requestPermission()` — the browser prompt.
2. **OneSignal subscription**: `OneSignal.User.PushSubscription.optIn()` — OneSignal registers the device.

Users must complete both. The order matters: native permission first, then OneSignal.

### NotificationsPage Flow

1. **Button 1 – Enable Native Notifications**
   - Calls `Notification.requestPermission()`.
   - Disabled when `Notification.permission === 'granted'`.

2. **Button 2 – Subscribe to OneSignal**
   - Enabled only when `oneSignalInitStatus === 'ready'` and `!oneSignalOptedIn`.
   - On click: shows a **custom modal** (“Allow” / “No Thanks”).
   - On “Allow”:
     ```js
     await os.Notifications.requestPermission();
     await os.User.PushSubscription.optIn();
     ```

We use our own modal instead of OneSignal’s Slidedown for full control over copy and UX.

---

## 3. Custom Prompt Instead of OneSignal Slidedown

**Why:** OneSignal’s built-in Slidedown appears automatically and is hard to control. We wanted:
- Our own copy and branding
- OneSignal prompts only when the user explicitly taps “Subscribe”

**How:**
- Disable auto-prompt in OneSignal Dashboard: **Settings → All Browsers → Permission Prompt → Turn off "Auto Prompt"**.
- On Subscribe click: show a custom modal; on Allow, call `requestPermission()` and `optIn()` ourselves.
- Never use `Slidedown.promptPush()` for the primary flow (we only reference it in `useNotificationSubscription.prompt()` as a fallback; the main UI uses the custom modal).

---

## 4. Subscription State Tracking (The Tricky Part)

OneSignal initializes asynchronously and may sync from IndexedDB. State can lag. We handle this with polling and `change` listeners.

### useNotificationSubscription (for banner visibility)

- Used by `App.jsx` to decide whether to show the “Enable notifications” banner.
- **optedIn**: `true` when subscribed, `false` when not, `null` while loading.
- **hasOneSignal**: `false` if OneSignal is disabled or not available (e.g. desktop, no app ID).
- **Enabled only on mobile**: `useNotificationSubscription(isMobile)` so desktop doesn’t see the banner.

**Logic:**
- Poll for `window.OneSignal` (up to 3 seconds).
- If `OneSignal.User.PushSubscription` exists:
  - `optedIn = sub.optedIn || Notification.permission === 'granted'` (we treat native granted as subscribed to avoid flashing the banner during async sync).
  - Listen to `PushSubscription.addEventListener('change')` to update state.
  - Re-check after 800ms in case OneSignal was syncing from IndexedDB.
- If `PushSubscription` is missing: keep polling briefly, otherwise treat as not opted in.

**Cleanup:** Remove the `change` listener on unmount.

### useNotificationDiagnostics (for NotificationsPage)

- Polls every 500ms: `onesignalInit.status`, `Notification.permission`, `OneSignal.User.PushSubscription?.optedIn`.
- Provides `appendLog(message, type)` for an Activity & Errors log.

---

## 5. NotificationsPage UI

- **Two buttons**: Enable Native → Subscribe to OneSignal.
- **Custom prompt modal**: Shown when user taps Subscribe but hasn’t opted in; “Allow” triggers `requestPermission()` and `optIn()`.
- **Activity & Errors**: Scrollable log of init status, native permission, subscription state, and user actions. Essential for debugging.

---

## 6. Mobile-Only Banner

In `App.jsx`:

```jsx
{isMobile && hasOneSignal && notificationOptedIn !== true && (
  <button onClick={() => { setActiveTab('notifications'); ... }}>
    <Bell />
    ENABLE BROCATION NOTIFICATIONS
  </button>
)}
```

- Shown only on mobile.
- Hidden when `optedIn === true` or when OneSignal isn’t configured.

---

## 7. Server-Side Sending

### When Notifications Run

`processNotifications(pool, data)` is called after:
- Score-scoped saves (`POST /api/score`)
- Round-scoped saves (`POST /api/round`)

It is **not** called for full-state saves (`POST /api/data`) to avoid sending on admin config changes.

### Flow

1. Load `brocation_notification_state` (sent keys, last standings, templates).
2. `runNotificationDetection(data, state)` finds new events (match complete, birdie, round complete, etc.).
3. For each event: `sendOneSignalNotification(appId, restApiKey, message, key)`.
4. Persist updated `sent` keys so the same event is never sent twice.

### OneSignal REST API

```js
fetch('https://api.onesignal.com/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `key ${restApiKey}`
  },
  body: JSON.stringify({
    app_id: appId,
    included_segments: ['Active Subscriptions'],
    contents: { en: message },
    target_channel: 'push'
  })
});
```

`included_segments: ['Active Subscriptions']` sends only to devices that have subscribed and are considered active.

### Persisted State (PostgreSQL)

```sql
CREATE TABLE brocation_notification_state (
  id INT PRIMARY KEY DEFAULT 1,
  sent JSONB NOT NULL DEFAULT '{}',
  last_standings JSONB NOT NULL DEFAULT '{"Insiders":0,"Outsiders":0}',
  templates JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- `sent`: Map of notification keys already sent.
- `templates`: Overridable message templates (with defaults in code).

---

## 8. Common Pitfalls & Troubleshooting

### 1. OneSignal Auto Slidedown

**Problem:** Slidedown appears at the wrong time.  
**Fix:** In OneSignal Dashboard → Settings → All Browsers → Permission Prompt → turn off “Auto Prompt”.

### 2. HTTPS and Canonical URL

**Problem:** Subscriptions fail on `http://` or non-www.  
**Fix:** OneSignal requires HTTPS. Configure redirects so all traffic goes to the canonical URL (e.g. `https://www.example.com`).

### 3. Service Worker Path

**Problem:** OneSignal can’t register the worker.  
**Fix:** Ensure `/push/OneSignalSDKWorker.js` is served. It must live in `public/push/` (or equivalent) and be served at the root (not under `/dist/` or similar).

### 4. optedIn During Async Init

**Problem:** Banner flashes “subscribe” even when the user is already subscribed.  
**Fix:** Treat `optedIn = OneSignal.PushSubscription.optedIn || Notification.permission === 'granted'`. Add an 800ms re-check after OneSignal reports ready (IndexedDB sync).

### 5. PushSubscription Not Ready Yet

**Problem:** `PushSubscription` is `null` briefly after init.  
**Fix:** Poll for it (e.g. every 200ms, up to ~3s), and treat “no sub yet” as not opted in so the Subscribe button stays enabled.

### 6. VITE_ Env Vars on Server

**Problem:** Server needs App ID but `VITE_*` is for client.  
**Fix:** On the server, read `process.env.VITE_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID`. Both are valid; pick based on how you deploy.

### 7. No Diagnostics When Things Break

**Problem:** Users can’t tell why subscriptions fail.  
**Fix:** Add an Activity & Errors log on the Notifications page showing init status, native permission, and OneSignal subscription state.

---

## 9. Checklist for Another Project

- [ ] Add `react-onesignal` and create `public/push/OneSignalSDKWorker.js`.
- [ ] Set `VITE_ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` in env.
- [ ] Initialize OneSignal in `main.jsx` with `serviceWorkerPath` and `scope`, no auto-prompt.
- [ ] Create `onesignalInit` status object; update it in init `then`/`catch`.
- [ ] Turn off OneSignal Auto Prompt in the dashboard.
- [ ] Implement a Notifications page with: (1) Enable Native, (2) Subscribe to OneSignal.
- [ ] Use a custom prompt modal instead of Slidedown; call `requestPermission()` and `optIn()` on Allow.
- [ ] Use polling + `PushSubscription.addEventListener('change')` for subscription state; include an 800ms re-check.
- [ ] Add an Activity & Errors diagnostic log for support and debugging.
- [ ] Show the notification banner only on mobile and only when not subscribed.
- [ ] Ensure HTTPS and canonical URL redirects.
- [ ] Serve `/push/OneSignalSDKWorker.js` correctly.
- [ ] Persist sent notification keys in the DB to avoid duplicates.
- [ ] Call `processNotifications` only after score/event saves, not on full config saves.

---

## File Reference

| File | Purpose |
|------|---------|
| `src/main.jsx` | OneSignal init at boot |
| `src/onesignalInit.js` | Init status object |
| `src/useNotificationSubscription.js` | optedIn for banner, mobile-only |
| `src/useNotificationDiagnostics.js` | Status + log for NotificationsPage |
| `src/NotificationsPage.jsx` | Two-step UI, custom prompt, Activity log |
| `public/push/OneSignalSDKWorker.js` | OneSignal service worker |
| `server/notifications.js` | Send via REST API, persist state |
| `server/notificationTriggers.js` | Event detection |
| `migrations/002_notification_state.sql` | DB table for sent keys |
