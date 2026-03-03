# Local Draft Simulation Implementation Plan

## Overview
Implement a local draft simulation system that allows players to conduct drafts on their local machine, with draft selections persisted to JSON files. **Only draft data is saved** - tournament results (golfer scores, positions, points) will be added manually via commands after the draft completes.

## Current State Analysis

**What exists:**
- Draft page UI (`FrontEnd/app/draft/page.tsx`) with basic selection functionality
- Draft selections stored in React state (lost on refresh)
- Completed tournament drafts stored in `results.json` (`teamDrafts` array)
- Fat Rando stealing logic exists in `dummyData.ts` but is hardcoded

**What's missing:**
- Draft state persistence (localStorage or JSON files)
- Fat Rando stealing implementation (currently hardcoded)
- Draft order logic (snake draft based on previous week's winner)
- Turn tracking (whose turn it is, pick number)
- Draft completion workflow (saving draft data to JSON)
- Activity log recording (PlayByPlay events) during draft

## Implementation Approach

### Draft Data Saved to JSON
When draft completes, save **only**:
- `fatRandoStolenGolfers`: Array of 4 golfer IDs that Fat Rando stole
- `teamDrafts`: Array of draft selections for each player
  - `playerId`: Player ID
  - `activeGolfers`: Array of 3 golfer IDs
  - `alternateGolfer`: Single golfer ID

**NOT saved automatically:**
- `golferResults`: Will be added manually round-by-round via commands
- `teamScores`: Will be calculated after golfer results are added

### JSON File Structure
The draft data will be saved to `results.json` with this structure:
```json
{
  "tournamentId": {
    "tournamentId": "4",
    "fatRandoStolenGolfers": ["golfer-4-2", "golfer-4-5", ...],
    "teamDrafts": [
      {
        "playerId": "1",
        "activeGolfers": ["golfer-4-1", "golfer-4-3", "golfer-4-4"],
        "alternateGolfer": "golfer-4-6"
      },
      ...
    ]
  }
}
```

Note: `golferResults` and `teamScores` will be added later via separate commands.

## Technical Implementation Details

### Files to Create/Modify

1. **`FrontEnd/lib/draft-types.ts`** (NEW)
   ```typescript
   export interface DraftState {
     tournamentId: string;
     fatRandoStolenGolfers: string[];
     currentPick: number;
     currentPlayerIndex: number;
     draftOrder: string[];
     picks: DraftPick[];
     playerPicks: Record<string, {
       activeGolfers: string[];
       alternateGolfer?: string;
     }>;
     activityLog: DraftEvent[]; // Activity log for PlayByPlay panel
   }
   
   export interface DraftPick {
     pickNumber: number;
     playerId: string;
     golferId: string;
     pickType: 'active' | 'alternate';
   }
   ```

2. **`FrontEnd/lib/draft-logic.ts`** (NEW)
   - `generateFatRandoSteals(golfers: Golfer[]): string[]` - Implements progressive random stealing (1-5, 1-10, 1-15, 1-20)
   - `calculateDraftOrder(players: Player[], previousWinnerId?: string): string[]` - Snake draft order calculation
   - `getCurrentDraftState(tournamentId: string): DraftState | null` - Load from localStorage
   - `saveDraftState(tournamentId: string, state: DraftState): void` - Save to localStorage
   - `completeDraft(tournamentId: string, teamDrafts: TeamDraft[], fatRandoStolenGolfers: string[]): Promise<void>` - Save draft data to JSON file

3. **`FrontEnd/app/draft/page.tsx`** (MODIFY)
   - Integrate draft logic functions
   - Implement turn tracking
   - Handle Fat Rando steals on draft start
   - **Record Fat Rando steal events in activity log** (add to PlayByPlay events)
   - **Record player selection events in activity log** as picks are made
   - **Persist activity log in localStorage** along with draft state
   - Save draft state to localStorage on each pick (including activity log)
   - When draft completes, save only draft data (teamDrafts + fatRandoStolenGolfers) to JSON
   - Show confirmation message when draft is saved

4. **`FrontEnd/components/tournament/PlayByPlay.tsx`** (MODIFY)
   - Update to display separator line AFTER Fat Rando steals, BEFORE player selections
   - Currently shows separator at end - needs to be repositioned between steal and select events
   - Render order: All steal events → Separator → All select events

5. **`FrontEnd/scripts/save-draft-to-json.ts`** (NEW)
   - Script to save completed draft data to `results.json`
   - Updates existing tournament entry or creates new entry
   - Only saves `fatRandoStolenGolfers` and `teamDrafts`
   - Does NOT generate or save `golferResults` or `teamScores`

### Data Flow

```
1. User opens draft page for tournament in "draft" state
   ↓
2. Check localStorage for existing draft state
   ↓
3. If new draft:
   - Generate Fat Rando steals (progressive random: 1-5, 1-10, 1-15, 1-20)
   - **Add Fat Rando steal events to activity log** (4 events, one per steal)
   - Calculate draft order (snake draft based on previous winner)
   - Initialize draft state in localStorage (including activity log)
   ↓
4. User makes selection
   ↓
5. **Add selection event to activity log** (player name, golfer name, golfer rank)
   ↓
6. Update draft state in localStorage (including updated activity log)
   ↓
6. Check if draft is complete (all players have 4 picks: 3 active + 1 alternate)
   ↓
7. If complete:
   - Save ONLY draft data to results.json:
     * fatRandoStolenGolfers
     * teamDrafts
   - Show success message
   - Tournament results (golferResults, teamScores) will be added manually later
```

### Storage Strategy

**LocalStorage Structure (temporary, during draft):**
```typescript
{
  [`draft-${tournamentId}`]: {
    tournamentId: string;
    fatRandoStolenGolfers: string[];
    currentPick: number;
    currentPlayerIndex: number;
    draftOrder: string[];
    picks: Array<{
      pickNumber: number;
      playerId: string;
      golferId: string;
      pickType: 'active' | 'alternate';
    }>;
    playerPicks: Record<string, {
      activeGolfers: string[];
      alternateGolfer?: string;
    }>;
    activityLog: DraftEvent[]; // Activity log for PlayByPlay panel
  }
}
```

**Activity Log Events (per Figma design):**
- Fat Rando steals: `{ type: 'steal', playerName: 'FAT RANDO', golferName: string, golferRank: number, timestamp: Date }`
  - Display format: `"FAT RANDO steals #1 Scottie Scheffler"` (player name bold, rank number, golfer name)
- Separator line: Added as a special event or rendered between steal events and select events
  - Display: `"---------------------------------"`
- Player selections: `{ type: 'select', playerName: string, golferName: string, golferRank: number, timestamp: Date }`
  - Display format: `"MTYTHOR selects #5 Russell Henley"` (player name bold/uppercase, rank number, golfer name)
- Events are added chronologically as they occur
- Order: All Fat Rando steals → Separator line → All player selections (in draft order)

**JSON File Structure (persistent, after draft):**
```json
{
  "tournamentId": {
    "tournamentId": "4",
    "fatRandoStolenGolfers": ["golfer-4-2", "golfer-4-5", "golfer-4-12", "golfer-4-18"],
    "teamDrafts": [
      {
        "playerId": "1",
        "activeGolfers": ["golfer-4-1", "golfer-4-3", "golfer-4-4"],
        "alternateGolfer": "golfer-4-6"
      },
      {
        "playerId": "2",
        "activeGolfers": ["golfer-4-7", "golfer-4-8", "golfer-4-9"],
        "alternateGolfer": "golfer-4-10"
      },
      {
        "playerId": "3",
        "activeGolfers": ["golfer-4-11", "golfer-4-13", "golfer-4-14"],
        "alternateGolfer": "golfer-4-15"
      },
      {
        "playerId": "4",
        "activeGolfers": ["golfer-4-16", "golfer-4-17", "golfer-4-19"],
        "alternateGolfer": "golfer-4-20"
      }
    ]
  }
}
```

## Implementation Details

### Activity Log Recording

The activity log (PlayByPlay panel) must record events in real-time as they occur:

1. **Fat Rando Steals** (at draft start):
   - When Fat Rando steals are generated, create 4 `DraftEvent` objects with `type: 'steal'`
   - Format: `"FAT RANDO steals #1 Scottie Scheffler"` (player name bold, rank number, golfer name)
   - Add separator line (`---------------------------------`) after all 4 steals, before player selections
   - Add to `activityLog` array in draft state

2. **Player Selections** (during draft):
   - When a player makes a selection, create `DraftEvent` object with `type: 'select'`
   - Format: `"MTYTHOR selects #5 Russell Henley"` (player name bold/uppercase, rank number, golfer name)
   - Include player name (uppercase), golfer name, and golfer rank
   - Add to `activityLog` array in draft state
   - Update PlayByPlay component to display new event immediately
   - Events appear chronologically after the separator line

3. **Persistence**:
   - Activity log is stored in localStorage along with draft state
   - On page refresh, activity log is restored from localStorage
   - Activity log is NOT saved to JSON (only displayed during draft)

4. **Display Format (per Figma design)**:
   - All Fat Rando steal events displayed first
   - Separator line (`---------------------------------`) displayed after steals, before selections
   - All player selection events displayed after separator
   - Each event shows: `[PLAYER NAME] [action] #[rank] [Golfer Name]`
   - Player names are bold/uppercase
   - Font: Consolas monospace, 12px, white text on dark background
   - Line height: 18px

### Fat Rando Stealing Logic
```typescript
function generateFatRandoSteals(golfers: Golfer[]): string[] {
  // Golfers are already sorted by rank (favorite to longshot)
  const available = [...golfers];
  const stolen: string[] = [];
  
  // Steal #1: Random 1-5
  const steal1 = Math.floor(Math.random() * 5);
  stolen.push(available[steal1].id);
  available.splice(steal1, 1);
  
  // Steal #2: Random 1-10 (from remaining)
  const steal2 = Math.floor(Math.random() * Math.min(10, available.length));
  stolen.push(available[steal2].id);
  available.splice(steal2, 1);
  
  // Steal #3: Random 1-15 (from remaining)
  const steal3 = Math.floor(Math.random() * Math.min(15, available.length));
  stolen.push(available[steal3].id);
  available.splice(steal3, 1);
  
  // Steal #4: Random 1-20 (from remaining)
  const steal4 = Math.floor(Math.random() * Math.min(20, available.length));
  stolen.push(available[steal4].id);
  
  return stolen;
}
```

### Draft Order Calculation
```typescript
function calculateDraftOrder(players: Player[], previousWinnerId?: string): string[] {
  // If no previous winner, use default order (player IDs 1, 2, 3, 4)
  if (!previousWinnerId) {
    return players.map(p => p.id);
  }
  
  // Find winner index
  const winnerIndex = players.findIndex(p => p.id === previousWinnerId);
  if (winnerIndex === -1) {
    return players.map(p => p.id);
  }
  
  // Snake draft order: Winner → 2nd → 3rd → 4th → 4th → 3rd → 2nd → 1st
  const order: string[] = [];
  const numPicks = 4; // 3 active + 1 alternate per player
  
  for (let round = 0; round < numPicks; round++) {
    if (round % 2 === 0) {
      // Forward order
      for (let i = 0; i < players.length; i++) {
        const index = (winnerIndex + i) % players.length;
        order.push(players[index].id);
      }
    } else {
      // Reverse order
      for (let i = players.length - 1; i >= 0; i--) {
        const index = (winnerIndex + i) % players.length;
        order.push(players[index].id);
      }
    }
  }
  
  return order;
}
```

### Saving Draft to JSON
The `completeDraft` function will:
1. Read existing `results.json`
2. Create or update the tournament entry with:
   - `tournamentId`
   - `fatRandoStolenGolfers`
   - `teamDrafts`
3. Write back to both `MockData/results.json` and `FrontEnd/public/api/results.json`
4. **Do NOT** generate or save `golferResults` or `teamScores`

## Limitations & Considerations

1. **Multi-Player Coordination**
   - Each player would need to manually enter picks in order
   - Or one player simulates all players' picks
   - No real-time synchronization

2. **Draft Validation**
   - Ensure no duplicate picks
   - Ensure Fat Rando golfers aren't selectable
   - Ensure all required picks are made (3 active + 1 alternate per player)

3. **Tournament Results**
   - After draft completes, `golferResults` and `teamScores` will be empty/null
   - These will be added manually via separate commands/scripts
   - The UI should handle missing results gracefully

## Testing Strategy

1. **Single Player Test**
   - Simulate all 4 players making picks
   - Verify draft order logic
   - Verify Fat Rando steals

2. **Draft Persistence Test**
   - Start draft, make some picks
   - Verify activity log shows Fat Rando steals and player selections
   - Refresh page - verify state persists from localStorage (including activity log)
   - Complete draft - verify JSON file updates with draft data only

3. **Draft Completion Test**
   - Complete full draft
   - Verify `teamDrafts` and `fatRandoStolenGolfers` saved correctly
   - Verify `golferResults` and `teamScores` are NOT in the JSON (or are empty/null)

## Future Backend Integration

When backend is ready:
- Replace localStorage with API calls
- Replace JSON file writes with API POST requests
- Add WebSocket for real-time multi-player coordination
- Keep draft logic functions reusable
