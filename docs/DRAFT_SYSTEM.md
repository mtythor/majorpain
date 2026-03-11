# Draft System – Project Context

This document describes the draft system architecture, data flow, and important implementation details for future development.

## Overview

The draft allows 4 players to select golfers in a snake-draft order. Fat Rando steals 4 golfers before the draft begins. Each player picks 3 active golfers + 1 alternate (16 picks total).

## Data Modes

| Mode | Trigger | Draft Storage | Completed Draft Storage |
|------|---------|---------------|-------------------------|
| **API** | `NEXT_PUBLIC_USE_API_CLIENT=true` | `draftStates[tournamentId]` in DB | `results[tournamentId]` in DB |
| **LocalStorage** | `NEXT_PUBLIC_USE_API_CLIENT=false` | `localStorage['draft-{id}']` | `localStorage['completed-draft-{id}']` |

## Save Behavior (Important)

**The draft is saved piecemeal, not only at completion.**

- **After each pick (1–15):** In-progress state is saved via `saveDraftStateToApi` (API) or `saveDraftState` (localStorage).
- **After pick 16 (last):** In-progress state is saved, then `saveCompletedDraftToApi` moves data to results and clears draft state.

## Key Files

| File | Purpose |
|------|---------|
| `FrontEnd/app/draft/page.tsx` | Draft page – state, API calls, UI |
| `FrontEnd/lib/draft-logic.ts` | Draft order, initialization, completion logic |
| `FrontEnd/lib/draft-types.ts` | `DraftState`, `DraftPick` types |
| `FrontEnd/lib/api-client.ts` | `fetchDraftState`, `saveDraftStateToApi`, `saveCompletedDraftToApi` |
| `FrontEnd/app/api/tournaments/[id]/draft/route.ts` | GET (fetch) / POST (complete) draft |
| `FrontEnd/app/api/tournaments/[id]/draft-state/route.ts` | POST in-progress draft state |

## API Routes – Critical Implementation Notes

### Request body must be read only once

The draft and draft-state POST handlers **must** parse `request.json()` exactly once. The body stream cannot be read twice. Parse at the top, then reuse the parsed body for auth and processing.

### Write secret

When `MAJOR_PAIN_WRITE_SECRET` is set on the server, the client must send the matching value via:

- Header: `X-Major-Pain-Write-Secret`
- Or body: `writeSecret`

Client uses `NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET`. Both must match.

## Draft Page – Session & State

### Tournament persistence

- **`sessionStorage['draft-selected-tournament-id']`** – Persists the selected tournament across navigations.
- Back navigation returns to the correct tournament's draft instead of defaulting to US Open.
- `getInitialSelectedTournament()` restores from sessionStorage when the cache is ready.

### Data loading

- **`useApiData()`** – Loads tournaments, players.
- **`useTournamentData(tournamentId)`** – Loads golfers for the selected tournament. **Required** for API mode; without it golfers are empty and the draft never initializes.

### Draft completion flow (API mode)

1. On last pick: `saveDraftStateToApi` (await) → `saveCompletedDraftToApi` (await).
2. Redirect only on success.

3. On failure: Show error banner with "Retry save" and "Go to team list". `pendingCompletionRef` holds the failed payload for retry.

## PlayByPlay / Activity Log

- `internalDraftState.activityLog` stores Fat Rando steals and player picks.
- `playByPlayEvents` is synced from `internalDraftState.activityLog` when `internalDraftState` changes (including when loaded from API).
- Without this sync, the activity panel stays empty when API returns draft state.

## DraftBanner

- Shows "Atticus is making his third pick..." or "Atticus is picking his alternate..." (or "her" for KristaKay).
- `pickNumber` (1–4) is derived from `currentPick` and number of players.
- `possessivePronoun` is `'her'` when `playerName === 'KristaKay'`.

## Draft Order (First Tournament)

For the first tournament, `getPreviousTournamentWinner()` returns undefined. `calculateDraftOrder()` falls back to default snake order (player IDs 1, 2, 3, 4). Draft order is not missing for the first tournament.

## Error Handling

- **401:** Write secret mismatch. Error message suggests checking env vars.
- **409:** Conflict (e.g. concurrent update). Suggests refresh and retry.
- **API save failure:** Draft stays in memory; user can retry or go to list.

## Environment Variables

```env
# Required for draft save
MAJOR_PAIN_WRITE_SECRET=your-secret
NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET=your-secret  # Must match

# API mode
NEXT_PUBLIC_USE_API_CLIENT=true
NEXT_PUBLIC_API_URL=/api
```
