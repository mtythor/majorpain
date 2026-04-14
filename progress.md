# Major Pain — Progress

## Done

### Foundation & Infrastructure
- [x] Initial project setup (React/Next.js, TypeScript, PostgreSQL)
- [x] Design token system and breakpoint unification
- [x] Dual-mode data layer (`api-db.ts`): PostgreSQL with JSON file fallback
- [x] GitHub Actions CI/CD deploy pipeline (master branch, SSH rsync, PM2 restart)
- [x] PWA support (installable, icons, manifest, cache-busting)
- [x] Build configured to not block on TS/ESLint errors

### Auth
- [x] Per-player JWT auth (4 hardcoded players: MtyThor, Atticus, KristaKay, MrHattyhat)
- [x] bcrypt password hashing, `seed-users` script
- [x] Admin endpoints secured with `MAJOR_PAIN_WRITE_SECRET`
- [x] Auth context provider (`lib/auth-context.tsx`)

### Draft System
- [x] Snake draft with turn-based ordering
- [x] Fat Rando steals (4 picks, progressive random ranges 1–5, 1–10, 1–15, 1–20)
- [x] OWGR import to rank the field for Fat Rando
- [x] Draft sync: SSE + polling to keep all clients in sync
- [x] Admin draft controls (set tournament to draft mode, manage picks)
- [x] `manualTestingMode` flag per tournament

### Live Data
- [x] RapidAPI / SlashGolf integration (`lib/live-golf-api.ts`)
- [x] Live tournament field import (`fieldSource: 'live'`)
- [x] Leaderboard mapper (`lib/leaderboard-mapper.ts`): API → `GolferTournamentResult[]`
- [x] Cron sync endpoint (`/api/cron/sync-results`) secured with `CRON_SECRET`
- [x] GitHub Actions cron: Thu–Mon 4am UTC, calls sync endpoint
- [x] Three syncs per day on playing days (morning, midday, evening)
- [x] Sync non-disruption: never touches `draftStates` or `teamDrafts`

### Scoring & Cut Protection
- [x] Scoring formula: `(100 - position) + bonus` (bonus tiers: 1st/+6, top5/+5, top10/+4, top20/+3)
- [x] Auto cut protection: alternate substitutes for any active golfer who misses the cut
- [x] Fat Rando cut protection: scoring + display (cut-protection-aware loop, not simple `slice(0,3)`)
- [x] `madeCut` strict equality bug fixed: all cut checks use truthy `!madeCut`, not `=== false`

### Voluntary Substitution
- [x] Substitution modal (`components/modal/SubstitutionModal.tsx`)
- [x] Substitution API endpoint (`PATCH /api/tournaments/[id]/substitution`): JWT auth, eligibility validation, recalcs `teamScores`
- [x] Eligibility: R2 complete, all 3 actives made cut, alternate made cut, no prior sub
- [x] Sub window closes at midnight local time on day 3 of the tournament
- [x] `startDate` parsed as local time (`new Date(startDate + 'T00:00:00')`) to avoid UTC midnight offset bug
- [x] Display: subbed-out golfers shown grey (`'out'` status) in both list and table views
- [x] Admin sub management: add/remove substitutions per team in admin tournament page
- [x] Admin override toggle: allows assigning same golfer to multiple teams (manual fix mode)

### Display & UI
- [x] Tournament list view (`/tournament/[id]/list`) with player cards
- [x] Tournament table view (`/tournament/[id]/table`) with desktop/mobile layouts
- [x] Season standings page with responsive layout
- [x] Cut/WD/alternate status colors: cut=red, WD=red, alt=gold, active=white
- [x] Alternate substituted-in shown as white (in play), not gold
- [x] Sub banner: yellow border, outside card, card loses bottom radius when banner active
- [x] Mobile nav: Lucide icons, icon toolbar, user avatar, action sheet
- [x] Mobile-responsive tournament table, leaderboard, draft page, season page
- [x] Venue bar + tournament selector layout

### Push Notifications (OneSignal)
- [x] OneSignal integration (`react-onesignal`, `lib/notification-state.ts`)
- [x] Subscription UI modal with opt-in flow
- [x] Draft turn notification (fires when it's your pick)
- [x] Substitution reminder notification (fires after R2 sync when player is eligible, per-player dedup)
- [x] Standings notification (fires after result syncs, guarded by `leader.totalPoints > 0`)
- [x] Notification diagnostics endpoint for debugging subscription/delivery issues
- [x] DB errors surfaced in sync response for production debugging

---

## To Do

### Admin UX Improvements
- [ ] **"Import from Live API" warning**: When `draftStates[tournamentId]` exists, show warning — "This will reset the draft. Only use before draft starts." *(planned in AUTO_PULL plan)*
- [ ] **Cut Line Score helper text**: When `fieldSource === 'live'`, add note that this field is only for dummy data/fallback; not needed for live tournaments. *(planned in PLAN_UPDATE_CUT_LINE_ADMIN)*
- [ ] **Admin per-tournament "Refresh Results" button**: Calls `/api/admin/tournaments/[id]/sync-results` directly; disabled when `state === 'draft'`. *(planned in AUTO_PULL plan — cron sync exists but no admin single-tournament trigger)*

### Game Logic
- [ ] **Fat Rando voluntary auto-sub**: After R2, if Fat Rando's alternate made the cut, auto-substitute for the active golfer with the worst position. *(documented in GameRules.md, not yet implemented)*

### Future Features
- [ ] **Forecasting system**: Predict/project tournament results as rounds progress (e.g. based on current leaderboard position)
- [ ] **Player profiles**: Allow players to upload/change profile pictures and display names
