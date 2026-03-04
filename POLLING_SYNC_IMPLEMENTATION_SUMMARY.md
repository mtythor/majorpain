# Polling Sync Implementation Summary

This document summarizes the polling solution used to keep all players in sync when updates are posted and saved. It covers the client-side poll logic, save flow, conflict handling, and the UI patterns established to avoid flicker and inconsistent updates. Use it as a guide for implementing real-time sync via polling in another project.

---

## Overview

- **Approach**: Periodic polling (every 2 seconds) of `GET /api/data` to fetch latest state
- **Optimistic locking**: Saves send `updated_at`; server returns 409 if version changed
- **Conflict resolution**: Client merges its edits into server data and retries
- **Key constraint**: Never overwrite user edits; poll must not apply server data when the user is typing or when we just saved

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLIENT (App.jsx)                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Refs:                                                                       │
│    lastKnownUpdatedAtRef  → version from last applied GET or successful POST  │
│    lastSaveCompletedAtRef → timestamp when our save completed                │
│    lastLoadAtRef          → timestamp when initial load applied scores      │
│    saveInProgressRef      → true while POST in flight                        │
│    hasUnsavedScoreEditsRef → true while score-scoped save pending/in flight  │
│    skipSaveFromPollRef    → when poll applies data, skip next save effect    │
│                                                                              │
│  Poll (2s): GET /api/data → if updatedAt > lastKnown, apply (with skips)     │
│  Save (800ms debounce): POST /api/data with scope + updated_at               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVER (Express + PostgreSQL)                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  GET  /api/data       → returns { players, rounds, scores, ..., updatedAt }   │
│  POST /api/data       → scope: 'scores' | 'round' | full; optimistic lock    │
│  brocation_state      → single row, data JSONB, updated_at TIMESTAMPTZ        │
│  saveDataToDbIfUnchanged → UPDATE WHERE updated_at = expected; 409 if miss    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Poll Logic

### When Poll Runs

- `setInterval(poll, 2000)` — every 2 seconds
- `visibilitychange` and `window focus` — immediate poll when tab becomes visible or window gains focus
- Initial poll delayed 1.5s after load completes (so we don't poll before data is ready)

### When Poll Skips Entirely (Does Not Fetch)

- `saveTimeoutRef.current` — user has unsaved edits (debounce timer running)
- `saveInProgressRef.current` — save POST is in flight
- `hasUnsavedScoreEditsRef.current` — score-scoped save pending or in flight
- `document.activeElement?.matches?.('input[data-score-input]')` — user is focused in a score cell (typing)

### When Poll Fetches But Skips Applying Scores

After a successful fetch, we compare `data.updatedAt` with `lastKnownUpdatedAtRef.current`:

1. **Nothing changed**: If `data.updatedAt === lastKnownUpdatedAtRef.current`, return early (no apply). Prevents redraw/flicker/scroll reset every 2s when nobody else updated.

2. **Scores apply skipped** when any of:
   - `saveTimeoutRef.current` or `saveInProgressRef.current` or `hasUnsavedScoreEditsRef.current` — don't overwrite pending/in-flight edits
   - `Date.now() - lastSaveCompletedAtRef.current < 1000` — we just saved; Postgres is consistent; avoid race
   - `Date.now() - lastLoadAtRef.current < 1000` — we just loaded; avoid race

When we skip applying scores, we still apply `players`, `rounds`, `courseSettings`, `scrambleHandicapPercentages` (those rarely change during score entry).

---

## 2. The Critical Rule: lastKnownUpdatedAtRef

**Only set `lastKnownUpdatedAtRef.current = data.updatedAt` when scores are actually applied** (or when the response has no scores to apply).

**Why:** If we skip `setScores` (e.g. because `lastSaveCompletedAtRef < 1s`) but still update `lastKnownUpdatedAtRef`, the next poll sees `updatedAt === lastKnown` and returns early. We never retry applying the skipped scores.

**Correct flow:**
```js
let scoresApplied = false;
if (data.scores && typeof data.scores === 'object') {
  if (/* skip conditions */) { /* skip */ }
  else {
    setScores(data.scores);
    scoresApplied = true;
  }
}
// Only mark as synced when we actually applied scores
if (data.updatedAt != null && (scoresApplied || !data.scores || typeof data.scores !== 'object')) {
  lastKnownUpdatedAtRef.current = data.updatedAt;
}
```

---

## 3. skipSaveFromPollRef

When the poll applies server data, we set `skipSaveFromPollRef.current = true`. The save effect (triggered by `players`, `rounds`, `scores`, etc. changing) checks this at the start:

```js
if (skipSaveFromPollRef.current) {
  skipSaveFromPollRef.current = false;
  return; // poll just applied server data; don't save it back (avoids overwriting other devices' updates)
}
```

**Why:** If we didn't skip, applying poll data would trigger a save effect, which would POST our "new" state back to the server. That state is already what the server has—we'd be doing redundant work, and in edge cases we could overwrite another device's concurrent update.

---

## 4. Save Flow

### Debounced Save (800ms)

Changes to `players`, `rounds`, `scores`, `courseSettings`, or `scrambleHandicapPercentages` trigger a debounced save. The save effect uses `lastEditedScopeRef` to decide scope:

- **Score-scoped** (`scope: 'scores'`, `roundId`, `pairingData`): Only the pairing's scores for that round
- **Round-scoped** (`scope: 'round'`, `roundId`, `roundScores`): Entire round's scores (e.g. scramble)
- **Full-state**: `players`, `rounds`, `scores`, etc.

Score/round scoped saves allow optimistic locking; full-state saves overwrite (used for admin config).

### Optimistic Locking (Server)

For score- and round-scoped saves, the client sends `updated_at: lastKnownUpdatedAtRef.current`. The server:

1. Loads current `data` and `updated_at` from DB
2. Applies the client's score/round changes to a copy
3. Calls `saveDataToDbIfUnchanged(payload, expectedUpdatedAt)`:
   - `UPDATE ... WHERE id = 1 AND date_trunc('millisecond', updated_at) = date_trunc('millisecond', $expected)`
   - If no row updated (someone else changed it), returns `null`
4. On conflict: Returns `409 { conflict: true, data: freshData, updatedAt }`

### Conflict Resolution (Client)

On 409, the client:

1. Sets `skipSaveFromPollRef.current = true` (so we don't trigger a save from applying merged data)
2. Updates `lastKnownUpdatedAtRef.current = json.updatedAt`
3. Merges **our edits** into `json.data` (so we don't lose them)
4. Applies merged data to state (`setPlayers`, `setRounds`, `setScores`, etc.)
5. Retries the POST with the same body (now `body.updated_at` is the fresh version)

The merge logic is scope-specific: for `scope: 'scores'`, we overlay `pairingData` scores onto `merged.scores[roundId]`; for `scope: 'round'`, we overlay `roundScores`.

---

## 5. After Save: Do NOT Call refreshFromServer

**Never** call `refreshFromServer()` after a successful save.

**Why:** `refreshFromServer()` fetches and does `setScores(data.scores)`. `ScoreEntry` has a `useEffect` that syncs `scores[round.id]` into its local `holeScores`. When `scores` changes, it overwrites the form. If the user is still typing in another cell, their in-progress edits are erased.

The save response already returns `updatedAt`; we update `lastKnownUpdatedAtRef` from that. The next poll will bring in any concurrent updates from other devices. No manual refresh needed.

---

## 6. Leaderboard Component (Avoid Flicker)

### Module Scope

`Leaderboard` is defined at **module scope** (above `BrocationTracker`), not inside it.

**Why:** Defining components inside a parent recreates them every render. React treats the new reference as a different component type and unmounts/remounts the entire subtree, causing visible flicker during polling.

### No React.memo

Do **not** wrap `Leaderboard` in `React.memo`.

**Why:** We tried it; it prevented re-renders when poll data changed, so the leaderboard stopped updating. Pass `rounds`, `players`, `standings`, etc. as props and let the leaderboard re-render on data change.

---

## 7. ScoreEntry and scores Sync

`ScoreEntry` holds local `holeScores` state. It:

- **Syncs from parent**: `useEffect` on `scores[round.id]` pushes `scores` into `holeScores` when server/poll data arrives
- **Syncs to parent**: `performSync()` merges `holeScores` into `scores` via `setScores`, and sets `lastEditedScopeRef` for the save effect
- **Debounced sync**: 800ms after `holeScores` changes, sync to parent (unless user is focused in a score input—avoids keyboard dismiss on mobile)
- **Blur sync**: On blur when leaving a score field (and not moving to another score field), sync immediately
- **Unmount flush**: On unmount, flush any unsaved `holeScores` to parent

Because `scores` flows down and overwrites `holeScores` in the effect, any change to `scores` (from poll or refresh) will overwrite the form. Hence: no `refreshFromServer` after save, and poll must not apply scores when the user is typing.

---

## 8. Data Attributes for Score Inputs

Score inputs use `data-score-input` (and sometimes `data-score-input="${id}"`) for:

- Poll skip: `document.activeElement?.matches?.('input[data-score-input]')` — don't poll-apply when user is in a score cell
- Refocus after sync: `pendingScoreRefocusRef` stores the selector; we refocus the field after a sync-triggered re-render
- Blur handling: Skip sync when `e.relatedTarget` is another score input (avoid re-render when auto-advancing)

---

## 9. Server API Summary

### GET /api/data

- Returns `{ players, rounds, scores, courseSettings, scrambleHandicapPercentages, updatedAt }`
- `updatedAt` is the `updated_at` timestamp from `brocation_state` (ISO string)

### POST /api/data

**Score-scoped:**
```json
{ "scope": "scores", "roundId": "...", "pairingData": { "playerIds": [...], "scores": {...} } }
```
or for scramble: `{ "teamKey": "...", "scores": [...] }`

**Round-scoped:**
```json
{ "scope": "round", "roundId": "...", "roundScores": {...} }
```

**Full-state:** `{ "players": [...], "rounds": [...], "scores": {...}, ... }`

All scoped saves can include `updated_at` for optimistic locking. Server returns `409 { conflict: true, data, updatedAt }` when the version changed.

---

## 10. Common Pitfalls & Troubleshooting

### 1. lastKnownUpdatedAtRef Updated When Skipping setScores

**Problem:** Poll skips applying scores (e.g. user just saved) but updates `lastKnownUpdatedAtRef`. Next poll sees same `updatedAt`, returns early, never applies the server data.

**Fix:** Only set `lastKnownUpdatedAtRef` when `scoresApplied` is true (or when response has no scores).

### 2. refreshFromServer After Save

**Problem:** User saves, we call `refreshFromServer()`, which does `setScores(data.scores)`. ScoreEntry's effect overwrites `holeScores`. User's in-progress edits in other cells are lost.

**Fix:** Never call `refreshFromServer()` after a successful save. Trust the save response and the next poll.

### 3. Leaderboard Defined Inside Parent

**Problem:** Every parent re-render creates a new `Leaderboard` function reference. React unmounts/remounts the whole leaderboard subtree → visible flicker every 2s.

**Fix:** Define `Leaderboard` at module scope.

### 4. React.memo on Leaderboard

**Problem:** Memo blocks re-renders. Poll updates `scores` but leaderboard doesn't re-render; standings appear stale.

**Fix:** Do not use `React.memo` on Leaderboard.

### 5. Poll Applying While User Types

**Problem:** User is in a score cell; poll applies `setScores`; form overwrites; edits lost or keyboard dismissed.

**Fix:** Skip poll apply when `document.activeElement?.matches?.('input[data-score-input]')`. Skip poll entirely when `saveInProgressRef` or `hasUnsavedScoreEditsRef`.

### 6. Save Effect Firing After Poll Apply

**Problem:** Poll applies server data → state changes → save effect runs → POST same data back. Redundant and risky.

**Fix:** Set `skipSaveFromPollRef.current = true` before applying poll data; save effect checks and returns.

### 7. PostgreSQL updated_at Precision

**Problem:** JS/client sends `updated_at` with millisecond precision; Postgres has microsecond. Direct equality can fail.

**Fix:** Server uses `date_trunc('millisecond', updated_at) = date_trunc('millisecond', $expected)` in the conditional update.

---

## 11. Checklist for Another Project

- [ ] Poll every 2s; also on `visibilitychange` and `focus` when tab becomes visible
- [ ] Skip poll when: save in progress, unsaved edits, user focused in editable field
- [ ] Skip applying scores when: save in progress, unsaved score edits, &lt;1s since our save, &lt;1s since load
- [ ] Only update `lastKnownUpdatedAtRef` when scores are actually applied (or response has no scores)
- [ ] Use `skipSaveFromPollRef` so save effect doesn't fire when poll applies data
- [ ] Never call refresh/reload after a successful save if it overwrites form state
- [ ] Define list/table components at module scope; do not wrap in `React.memo` if they must re-render on data change
- [ ] Use optimistic locking: send `updated_at`, handle 409 with merge and retry
- [ ] Server: conditional update `WHERE updated_at = expected`; return 409 with fresh data on conflict
- [ ] Use `date_trunc('millisecond', ...)` for timestamp comparison if client sends ms precision
- [ ] Score inputs: use `data-score-input` to detect focus and skip poll apply when user is typing

---

## File Reference

| File | Purpose |
|------|---------|
| `src/App.jsx` | Poll effect, save effect, refs, conflict handling, Leaderboard usage |
| `server/index.js` | `GET /api/data`, `POST /api/data`, `saveDataToDbIfUnchanged` |
| `.cursor/rules/leaderboard-polling.mdc` | Cursor rules preserving these patterns |
| `.cursorrules` | Project-level reminder of leaderboard and polling rules |
