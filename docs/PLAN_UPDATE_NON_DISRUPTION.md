# Plan Update: Non-Disruption Guarantees for Live Draft

Add the following section to the Auto-Pull RapidAPI Results plan to ensure the first tournament's live draft is not disrupted.

---

## New Section: Non-Disruption Guarantees (Insert after Architecture, before Implementation Plan)

### Summary

The results sync feature must **never** touch draft-related data. It only updates `golferResults` and `teamScores` within existing `TournamentResult`. No re-import, no field changes, no draft reset.

### What the Sync Touches (and Does Not Touch)

| Data | Sync behavior |
|------|---------------|
| `data.golfers[tournamentId]` | **Never touched.** Field stays exactly as imported. |
| `data.draftStates[tournamentId]` | **Never touched.** Draft state (picks, turn order) preserved. |
| `data.results[tournamentId].teamDrafts` | **Preserved.** Merge logic keeps existing teamDrafts. |
| `data.results[tournamentId].fatRandoStolenGolfers` | **Preserved.** Merge logic keeps existing steals. |
| `data.results[tournamentId].golferResults` | **Replaced** with mapped API data. |
| `data.results[tournamentId].teamScores` | **Recalculated** from teamDrafts + golferResults. |
| `data.tournaments` | **Never touched** by sync. |

### When Sync Runs

- **Cron**: Only for tournaments with `state === 'playing'` or `state === 'completed'`. **Never** during `state === 'draft'`.
- **Admin "Refresh results" button**: Only enabled when `state === 'playing'` or `state === 'completed'`. Disabled/hidden during draft to avoid confusion.

### Merge Preconditions

Sync only proceeds when:

1. `results[tournamentId]` exists and has `teamDrafts` with length > 0 (draft completed).
2. If no teamDrafts, **skip**—do not create a new TournamentResult from scratch. That would overwrite draft output.

### Import Field vs Sync Results (Critical Distinction)

| Action | What it does | When to use |
|--------|--------------|-------------|
| **Import from Live API** | Re-fetches field, **wipes** `draftStates[tournamentId]` and `teamDrafts`/`fatRandoStolenGolfers` for that tournament. Destructive. | Initial setup only, before draft starts. |
| **Refresh results from Live API** (new) | Fetches leaderboard, updates `golferResults` and `teamScores` only. Preserves everything else. | During/after tournament play. |

**Do not** use "Import from Live API" during or after a draft—it will reset the draft. The new "Refresh results" button is safe; it never touches field, draftStates, or teamDrafts.

### Implementation Checklist

- [ ] Sync route: Only merge into existing `results[tournamentId]` when `teamDrafts?.length > 0`. Skip otherwise.
- [ ] Sync route: Use spread/merge that explicitly preserves `teamDrafts`, `fatRandoStolenGolfers`. Never overwrite.
- [ ] Admin "Refresh results" button: Disable when `getTournamentState(tournament) === 'draft'`.
- [ ] Cron filter: Exclude tournaments where `state === 'draft'`.
- [ ] Consider adding a warning on the "Import from Live API" button when `draftStates[tournamentId]` exists: "This will reset the draft. Only use before draft starts."
