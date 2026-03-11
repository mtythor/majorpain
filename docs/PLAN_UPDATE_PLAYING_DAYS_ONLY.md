# Plan Update: Sync Only on Tournament Playing Days

Replace or update **Section 5. Scheduling and API Call Budget** in the Auto-Pull RapidAPI Results plan with the following.

---

## Revised Section 5. Scheduling and API Call Budget

**RapidAPI free tier**: Exact limits unknown (pricing page blocked). Design for ~100–200 calls/month.

**Strategy: sync only on playing days**

- **Playing days**: Typically Thu–Sun. Tournaments can extend to Mon (or beyond) for playoffs or weather delays.
- **Cron schedule**: Run only on Thu, Fri, Sat, Sun, Mon — not every day. No sync on Mon–Wed when no tournaments are typically playing.
- **Per sync**: 1 API call per in-progress tournament. At most 1 tournament "playing" at a time → 0–1 calls per sync (0 when no tournament is playing).
- **Estimate**: ~4–6 syncs per tournament (Thu–Sun, maybe Mon) × 1 call = 4–6 calls per tournament, ~35–55/season for 8 stroke-play events.

**Cron schedule (playing days only)**

- **GitHub Actions**: `cron: '0 4 * * 4,5,6,0,1'` — 4am UTC on Thu(4), Fri(5), Sat(6), Sun(0), Mon(1). Adjust for ET if needed (e.g. 4am UTC ≈ 11pm ET previous day).
- **Vercel Cron**: Limited to 1/day on free tier; schedule for a playing day (e.g. Sun 4am UTC) or use GitHub Actions for finer control.
- **External cron**: Configure to run Thu–Mon only.

**Overlap days (R2/R3)**: If 2x/day is needed for tight R2/R3 windows, run twice on Fri and Sat only (e.g. 4am + 11pm UTC). Configurable via env.

**Early exit**: The sync route should still filter by `state === 'playing'`. If the cron fires on a Thu but no tournament has started yet (or all have ended), the filter yields 0 tournaments → 0 API calls. Safe to run on playing days even when no event is active.
