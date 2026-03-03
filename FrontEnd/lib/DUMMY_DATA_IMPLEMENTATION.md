# Implementing Dummy Data Without Breaking the UI

This guide explains how dummy data is wired for testing and how to keep the UI stable when switching to a real API later.

## Approach: Single Data Layer

All **pages** get data from **one place**: `@/lib/data.ts`. They do **not** import from `@/lib/dummyData.ts` directly.

- **`lib/dummyData.ts`** – Raw dummy data (tournaments, golfers, results). Used only by the data layer.
- **`lib/data.ts`** – Data layer. Exposes a small API and adapts dummy data into the shapes the UI expects.

Benefits:

1. **UI stays unchanged** – Pages and components keep calling the same functions.
2. **One place to switch to API** – When the backend exists, change only `lib/data.ts` (and add env/feature flags if needed).
3. **Stable testing** – Dummy data is deterministic; same data every load.
4. **No scattered mocks** – No inline mock data in pages; everything flows from the data layer.

## What Pages Use

| Page | Data used | Source in `data.ts` |
|------|-----------|----------------------|
| **Draft** (`/draft`) | Tournaments, golfers, draft state, play-by-play | `getTournaments()`, `getGolfers()`, `getTournamentData()`, `getCurrentTournament()`, `getPlayers()`, `getCurrentUser()` |
| **Season** (`/season`) | Season standings, tournament names, current user | `getSeasonStandings()`, `getSeasonTournamentNames()`, `getCurrentUser()` |
| **Tournament list** (`/tournament/[id]/list`) | Tournaments, selected tournament, player cards | `getTournaments()`, `getTournament()`, `getPlayerCardsForTournament()`, `getCurrentUser()` |
| **Tournament table** | Same idea as list; can be wired to `getTournament()`, `getPlayerCardsForTournament()` when needed | (wire when you build out the table view) |

## Adapters: Matching UI Shapes

Components expect specific shapes (e.g. `SeasonTable` expects `PlayerSeasonData`, `PlayerCards` expects `PlayerCardData`). The data layer **adapts** dummy data into those shapes so components don’t need to know about dummy vs API.

- **`getSeasonStandings()`** – Returns rows for `SeasonTable`: `playerId`, `playerName`, `playerImage`, `playerColor`, `tournamentScores`, `seasonAverage`, `seasonPoints`. Built from `getAllTournamentData()` and trophy logic.
- **`getSeasonTournamentNames()`** – List of completed tournament names for the season table header.
- **`getPlayerCardsForTournament(tournamentId)`** – Returns player cards for `PlayerCards`: `id`, `name`, `imageUrl`, `avgPos`, `points`, `bonus`, `total`, `color`, `golfers` (with `rank`, `name`, `status`). Built from `getTournamentData()` and `dummyTournamentResults`.

When you add new UI that needs a new shape, add a new function in `data.ts` that returns that shape from dummy (or later from API).

## Rules to Avoid Breaking the UI

1. **Pages import only from `@/lib/data`**  
   Don’t import `dummyData` (or API client) in pages. All data comes from `data.ts`.

2. **Components stay dumb**  
   Components receive props in the shape they already use. The data layer does the shaping; components don’t care if the source is dummy or API.

3. **Don’t change component prop types for “dummy vs API”**  
   If the UI needs a new field, add it in the adapter in `data.ts` (and in dummy data if needed). Keep component interfaces stable.

4. **Handle missing data safely**  
   - `getTournament(id)` can return `undefined` → use `?? getTournaments()[0]` or similar when a default is OK.
   - `getTournamentResult(id)` can return `null` for non-completed tournaments → `getPlayerCardsForTournament` returns `[]` when there’s no result.

5. **Keep dummy data deterministic**  
   No `Math.random()` in hot paths; use fixed lists and seeded logic so tests and manual testing are reproducible.

## Adding a New Page That Needs Data

1. Add a function in `lib/data.ts` that returns the exact shape your new component expects.
2. In the page, import that function from `@/lib/data` and pass the result as props.
3. Implement the function using dummy data (and later swap to API inside the same function).

## Switching to a Real API Later

1. In `lib/data.ts`, replace the implementation of each function with an API call (or a branch on an env flag, e.g. `USE_MOCK_DATA`).
2. If the API returns different shapes, map the API response to the **same** return types that the UI already uses (so no component changes).
3. Keep `dummyData.ts` (or a subset) for tests and for a “mock data” mode if you want to keep testing without the API.

## Quick Checklist

- [ ] All pages use only `@/lib/data` for app data (no direct `dummyData` in pages).
- [ ] New UI shapes are built in `data.ts` via adapter functions.
- [ ] Missing/empty data is handled (undefined tournament, null result, empty arrays).
- [ ] Dummy data is deterministic for repeatable testing.
- [ ] When adding API: change only `data.ts` and keep component interfaces unchanged.
