# Mock Data Usage Guide

## Overview

The application now supports two data modes:

1. **Dummy Data Mode (Default)**: Uses in-memory TypeScript data from `dummyData.ts`
2. **API Client Mode**: Fetches from mock JSON files or real backend API

## Switching Modes

### Using Dummy Data (Default)

No configuration needed. The app uses dummy data by default.

### Using Mock JSON Files

1. Create `.env.local` in `FrontEnd/` directory:
   ```
   NEXT_PUBLIC_USE_API_CLIENT=true
   NEXT_PUBLIC_API_URL=/api
   ```

2. Ensure JSON files exist in `FrontEnd/public/api/`:
   - Run `npm run export-mock-data` to generate them

3. Use the `useApiData()` hook in your components:
   ```tsx
   import { useApiData } from '@/lib/use-api-data';
   
   export default function MyComponent() {
     const { loading, error } = useApiData();
     
     if (loading) return <div>Loading...</div>;
     if (error) return <div>Error: {error.message}</div>;
     
     // Now you can use sync functions from data.ts
     const tournaments = getTournaments();
     // ...
   }
   ```

### Using Real Backend API

1. Update `.env.local`:
   ```
   NEXT_PUBLIC_USE_API_CLIENT=true
   NEXT_PUBLIC_API_URL=https://your-backend-api.com
   ```

2. Ensure your backend implements these endpoints:
   - `GET /tournaments` - Returns array of tournaments
   - `GET /tournaments/:id` - Returns single tournament
   - `GET /tournaments/:id/golfers` - Returns golfers for tournament
   - `GET /tournaments/:id/results` - Returns tournament results (or 404)
   - `GET /players` - Returns array of players

3. Use the same `useApiData()` hook in components

## Files Created

- `FrontEnd/lib/api-client.ts` - API client functions
- `FrontEnd/lib/use-api-data.ts` - React hooks for loading API data
- `FrontEnd/scripts/export-dummy-data-to-json.ts` - Script to export dummy data to JSON
- `MockData/` - Directory with JSON files
- `FrontEnd/public/api/` - JSON files served by Next.js

## API Client Functions

All functions in `api-client.ts` are async and return promises:

- `fetchTournaments()` - Fetch all tournaments
- `fetchTournament(id)` - Fetch single tournament
- `fetchGolfers(tournamentId)` - Fetch golfers for tournament
- `fetchTournamentResult(tournamentId)` - Fetch tournament results
- `fetchPlayers()` - Fetch all players
- `fetchCurrentUser()` - Fetch current user
- `fetchTournamentData(tournamentId)` - Fetch tournament, golfers, and results
- `fetchCurrentTournament()` - Fetch current tournament
- `fetchCompletedTournaments()` - Fetch completed tournaments
- `fetchAllTournamentData()` - Fetch all tournament data

## Data Layer Functions

Functions in `data.ts` remain synchronous for backward compatibility:

- `getTournaments()` - Get all tournaments (sync)
- `getTournament(id)` - Get tournament (sync)
- `getGolfers(tournamentId)` - Get golfers (sync)
- `getTournamentResult(tournamentId)` - Get results (sync)
- `getPlayers()` - Get players (sync)
- `getCurrentUser()` - Get current user (sync)
- `getTournamentData(tournamentId)` - Get tournament data (sync)
- `getCurrentTournament()` - Get current tournament (sync)
- `getCompletedTournaments()` - Get completed tournaments (sync)
- `getSeasonStandings()` - Get season standings (sync)
- `getSeasonTournamentNames()` - Get tournament names (sync)
- `getPlayerCardsForTournament(tournamentId)` - Get player cards (sync)

When API client mode is enabled, these functions read from a cache populated by `useApiData()` hook.

## Example Usage

### Client Component with API Data

```tsx
'use client';

import { useApiData, useTournamentData } from '@/lib/use-api-data';
import { getTournaments, getTournamentData } from '@/lib/data';

export default function TournamentPage({ tournamentId }: { tournamentId: string }) {
  const { loading: loadingData, error: dataError } = useApiData();
  const { loading: loadingTournament, error: tournamentError } = useTournamentData(tournamentId);
  
  if (loadingData || loadingTournament) return <div>Loading...</div>;
  if (dataError || tournamentError) return <div>Error loading data</div>;
  
  const tournaments = getTournaments();
  const { tournament, golfers, results } = getTournamentData(tournamentId);
  
  // Use the data...
}
```

### Server Component (Next.js)

Server components can directly use async API functions:

```tsx
import { fetchTournaments, fetchTournamentData } from '@/lib/api-client';

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const tournaments = await fetchTournaments();
  const { tournament, golfers, results } = await fetchTournamentData(params.id);
  
  // Use the data...
}
```

## Migration Path

When migrating from dummy data to real backend:

1. Export current dummy data to JSON (already done)
2. Set `NEXT_PUBLIC_USE_API_CLIENT=true` in `.env.local`
3. Start with `NEXT_PUBLIC_API_URL=/api` to test with mock JSON files
4. Update `NEXT_PUBLIC_API_URL` to point to real backend when ready
5. No code changes needed in pages/components!
