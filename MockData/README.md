# Mock Data Directory

This directory contains JSON files with mock data that simulates the backend API structure.

## Files

- `tournaments.json` - Array of all tournaments
- `golfers.json` - Object mapping tournament ID to array of golfers
- `results.json` - Object mapping tournament ID to tournament result (or null)
- `players.json` - Array of all players

## Usage

These files are automatically generated from `FrontEnd/lib/dummyData.ts` by running:

```bash
npm run export-mock-data
```

The files are also copied to `FrontEnd/public/api/` for Next.js to serve them statically.

## Switching to Real Backend

When the real backend is ready:

1. Update `FrontEnd/.env.local`:
   ```
   NEXT_PUBLIC_USE_API_CLIENT=true
   NEXT_PUBLIC_API_URL=https://your-backend-api.com
   ```

2. Ensure the real backend implements the same endpoint structure:
   - `GET /tournaments` - Returns array of tournaments
   - `GET /tournaments/:id` - Returns single tournament
   - `GET /tournaments/:id/golfers` - Returns golfers for tournament
   - `GET /tournaments/:id/results` - Returns tournament results
   - `GET /players` - Returns array of players

3. The frontend will automatically switch to using the real API.
