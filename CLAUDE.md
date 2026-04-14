# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Major Pain Fantasy Golf** - A full-stack fantasy golf web app for 2-4 players who draft professional golfers and score points based on real tournament results. Includes a snake draft system, Fat Rando bot, cut protection, Ryder Cup special format, and live score syncing.

Production URL: https://majorpain.devinhansen.com

## Commands

All commands run from `FrontEnd/`:

```bash
npm run dev          # Dev server on 0.0.0.0:3000
npm run build        # Production build
npm start            # Run production server
npm run lint         # ESLint check
npm run migrate      # Run SQL migrations against DATABASE_URL
npm run seed         # Seed state from .data/state.json into Postgres
npm run seed-users   # Create/reset user accounts with bcrypt hashes
```

There is no test suite. API integrations are tested via one-off scripts:
```bash
npm run test-slash-golf               # Test RapidAPI golf data integration
npm run test-arnold-palmer-leaderboard
npm run test-owgr                     # Test OWGR import
```

## Architecture

### Directory Structure
```
FrontEnd/
├── app/
│   ├── api/          # Next.js API routes (REST endpoints)
│   ├── admin/        # Admin panel pages
│   ├── draft/        # Draft UI
│   ├── season/       # Season standings
│   └── tournament/[id]/  # Tournament detail pages
├── components/       # React components (39 files, organized by feature)
├── hooks/            # Custom React hooks (polling, notifications)
├── lib/              # Core logic and utilities
│   ├── api-db.ts     # Dual-mode data layer (Postgres or JSON file)
│   ├── api-client.ts # HTTP client for frontend → API calls
│   ├── auth.ts       # JWT signing/verification + bcrypt
│   ├── auth-context.tsx  # React auth context provider
│   ├── db.ts         # PostgreSQL connection pool
│   ├── draft-logic.ts    # Draft algorithm (snake order, Fat Rando)
│   ├── draft-types.ts    # Core TypeScript interfaces
│   ├── leaderboard-mapper.ts  # Score calculations
│   └── live-golf-api.ts  # RapidAPI integration for live data
├── scripts/          # One-off utility scripts (run via tsx)
└── migrations/       # SQL migrations (001–005)
```

### Data Layer (`lib/api-db.ts`)

The app has a dual-mode data layer:
- **With `DATABASE_URL`**: reads/writes from PostgreSQL `major_pain_state` table (single JSONB row, `id=1`)
- **Without `DATABASE_URL`**: falls back to `.data/state.json` for zero-setup local dev

All game state (tournaments, drafts, golfers, results) lives in this single JSONB document.

### Authentication

- JWT tokens signed with `JWT_SECRET`, stored in localStorage
- Four hardcoded players: MtyThor (1), Atticus (2), KristaKay (3), MrHattyhat (4)
- Admin endpoints require `MAJOR_PAIN_WRITE_SECRET` header
- `lib/auth-context.tsx` provides the React auth context

### Real-time Updates

- **Polling**: `hooks/usePolling.ts` periodically calls the API
- **Cron**: `/api/cron/sync-results` endpoint for automated result syncing (secured with `CRON_SECRET`)
- **Push notifications**: OneSignal via `react-onesignal` and `lib/notification-state.ts`

## Environment Variables

Copy `FrontEnd/.env.example`. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (omit to use JSON file fallback) |
| `JWT_SECRET` | JWT token signing key |
| `MAJOR_PAIN_WRITE_SECRET` | Server-side admin API auth |
| `NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET` | Client-side write auth |
| `RAPIDAPI_KEY` | Live golf data API (RapidAPI) |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | OneSignal push notifications |
| `ONESIGNAL_REST_API_KEY` | Server-side notification sending |
| `CRON_SECRET` | Cron endpoint auth |
| `NEXT_PUBLIC_USE_API_CLIENT` | `true` = live API; `false` = dummy data |

## Game Rules Summary

- **Scoring**: `(100 - final_position) + bonus`. Bonuses: 1st=+6, 2nd–5th=+5, 6th–10th=+4, 11th–20th=+3
- **Team**: 3 active golfers + 1 alternate per tournament
- **Draft**: Snake draft; previous week's winner picks first
- **Fat Rando**: Bot that steals 4 golfers before the draft using progressive random selection (ranges 1–5, 1–10, 1–15, 1–20)
- **Cut protection**: If an active golfer misses the cut, the alternate substitutes automatically
- **Ryder Cup**: Special match-play scoring (25 pts/singles win, 20 pts/pairs win), no alternates, Fat Rando inactive
- See `docs/GameRules.md` for full rules

## Deployment

- **Host**: DigitalOcean droplet, port 3001, behind Nginx
- **Process manager**: PM2 (process name: `major-pain`)
- **CI/CD**: GitHub Actions → SSH → rsync → PM2 restart
- See `docs/DEPLOY.md` for full deployment instructions and troubleshooting

## Session Start

At the start of each session, read `progress.md` in the project root to get context on what has been built and what is still to do.

## TypeScript / Build Notes

`next.config.js` is configured to **not block builds** on TypeScript errors or ESLint warnings. Fix issues but don't rely on the build failing to catch them.
