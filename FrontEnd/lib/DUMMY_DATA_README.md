# Dummy Data for Testing

This directory contains comprehensive dummy data for testing the Major Pain Fantasy Golf application.

## Overview

The dummy data includes:
- **3 completed tournaments** (The Masters, PGA Championship, US Open)
- **100 golfers per tournament** with realistic names
- **4 complete rounds** for each golfer who made the cut
- **Drafted teams** for 4 players (MtyThor, Atticus, KristaKay, MrHattyhat)
- **Fat Rando stolen golfers** (4 per tournament)
- **Complete scoring** with final positions, base points, bonus points, and total points
- **Team scores** calculated from drafted golfers

## Data Structure

### Tournaments
- `dummyTournaments`: Array of 3 tournament objects with id, name, dateRange, and backgroundImage

### Golfers
- `dummyGolfers`: Record mapping tournament ID to array of 100 golfers
- Each golfer has: id, name, rank

### Tournament Results
- `dummyTournamentResults`: Record mapping tournament ID to tournament result object
- Each result includes:
  - `fatRandoStolenGolfers`: Array of 4 golfer IDs stolen by Fat Rando
  - `teamDrafts`: Array of team drafts (4 players, each with 3 active golfers + 1 alternate)
  - `golferResults`: Array of results for all 100 golfers including:
    - Final position (or null if missed cut)
    - 4 rounds of scores (or 2 if missed cut)
    - Total score and toPar
    - Base points, bonus points, and total points
  - `teamScores`: Array of team scores with total points and individual golfer points

## Usage

### Import the data
```typescript
import { 
  dummyTournaments, 
  dummyGolfers, 
  dummyTournamentResults,
  getTournamentData,
  getAllTournamentData,
  dummyPlayers
} from '@/lib/dummyData';
```

### Get data for a specific tournament
```typescript
const { tournament, golfers, results } = getTournamentData('1');

console.log(tournament?.name); // "THE MASTERS"
console.log(golfers.length); // 100
console.log(results.teamScores); // Array of team scores
```

### Get all tournament data
```typescript
const allData = getAllTournamentData();

allData.forEach(({ tournament, golfers, results }) => {
  console.log(`${tournament.name}: ${golfers.length} golfers`);
});
```

### Access specific golfer results
```typescript
const { golfers, results } = getTournamentData('1');
const golfer = golfers[0]; // First golfer
const golferResult = results.golferResults.find(r => r.golferId === golfer.id);

if (golferResult) {
  console.log(`${golfer.name}: Position ${golferResult.finalPosition}`);
  console.log(`Rounds:`, golferResult.rounds);
  console.log(`Total points: ${golferResult.totalPoints}`);
}
```

### Calculate season standings
```typescript
const allData = getAllTournamentData();
const playerTotals = new Map<string, number>();

allData.forEach(({ results }) => {
  results.teamScores.forEach(score => {
    const current = playerTotals.get(score.playerId) || 0;
    playerTotals.set(score.playerId, current + score.totalPoints);
  });
});

// Sort by total points
const standings = Array.from(playerTotals.entries())
  .map(([playerId, totalPoints]) => {
    const player = dummyPlayers.find(p => p.id === playerId);
    return {
      player,
      totalPoints,
      averagePoints: totalPoints / allData.length,
    };
  })
  .sort((a, b) => b.totalPoints - a.totalPoints);
```

## Data Characteristics

### Scoring
- **Base Points**: 100 - final position
- **Bonus Points**: 
  - 1st place: +6
  - 2nd-5th: +5
  - 6th-10th: +4
  - 11th-20th: +3
  - Below 20th: 0
- **Missed Cut**: 0 points total

### Cut Line
- Top 70 golfers make the cut (play all 4 rounds)
- Bottom 30 golfers miss the cut (only play 2 rounds)

### Team Composition
- Each player drafts 3 active golfers + 1 alternate
- If an active golfer misses the cut, the alternate automatically replaces them (if alternate made cut)

### Fat Rando
- Steals 4 golfers before the draft
- These golfers are removed from the draft pool
- Fat Rando's scores are tracked separately

## Field Source (Testing vs Live)

Per-tournament admin control lets you choose the golfer field source:

- **Dummy (testing)**: Use "Seed Field" to populate with dummy golfers from `dummyGolfers`. Ideal for draft testing without external APIs.
- **Live API**: Set field source to "Live API", then click "Import from Live API" to fetch the real tournament field from RapidAPI Live Golf Data. Requires `RAPIDAPI_KEY` in `.env.local`. When field source is live and state has no golfers, the golfers API will auto-fetch from the live API on first request.

## Deterministic Data

All data is **deterministic** - it will be the same every time the app loads. This ensures consistent testing and development.

## Example Files

See `dummyDataExample.ts` for more detailed usage examples including:
- Getting tournament data
- Calculating season standings
- Tracking golfer performance across tournaments
