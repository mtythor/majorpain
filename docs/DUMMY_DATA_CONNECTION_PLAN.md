# Dummy Data Connection Plan

## Overview
This document outlines the plan for connecting dummy tournament data to the draft page system for testing purposes.

## Current State
- The system has a draft page (`draft-page-web.html`) that displays tournament information
- There's existing dummy data infrastructure in `FrontEnd/lib/dummyData.ts`
- The season page lists 9 tournaments for the season
- Tournament picker exists but needs to be populated with all 9 tournaments

## Data Structure Requirements

### Tournament List (9 tournaments)
1. **PLAYERS CHAMPIONSHIP** - Feb 1-4, 2026 (Completed)
2. **THE MASTERS** - Mar 1-4, 2026 (Completed)
3. **PGA CHAMPIONSHIP** - Apr 1-4, 2026 (Completed)
4. **U.S. OPEN** - May 1-4, 2026 (Current - Draft State)
5. **OPEN CHAMPIONSHIP** - Jun 1-4, 2026 (Pre-draft)
6. **FEDEX ST. JUDE** - Jul 1-4, 2026 (Pre-draft)
7. **BMW CHAMPIONSHIP** - Aug 1-4, 2026 (Pre-draft)
8. **TOUR CHAMPIONSHIP** - Sep 1-4, 2026 (Pre-draft)
9. **RYDER CUP** - Oct 1-4, 2026 (Pre-draft)

### Tournament States
- **Completed (Events 1-3)**: Full results available, completed drafts, final scores visible
- **Draft (Event 4)**: Draft has started but no selections made yet, no results
- **Pre-draft (Events 5-9)**: Tournament not started, draft not started, no data available

## Implementation Steps

### Step 1: Update Dummy Data Structure
**File**: `FrontEnd/lib/dummyData.ts`

1. **Expand Tournament List**
   - Add all 9 tournaments with correct dates (1st-4th of each month)
   - Set proper `state` field for each tournament
   - Add `draftStartDate`, `startDate`, `endDate` fields

2. **Generate Completed Tournament Data (Events 1-3)**
   - Generate full tournament results with:
     - Final positions for all golfers
     - Round-by-round scores
     - Team drafts (completed selections)
     - Team scores
     - Fat Rando stolen golfers
   - Ensure deterministic data for consistent testing

3. **Generate Current Tournament Data (Event 4 - U.S. OPEN)**
   - Generate golfer list with ranks
   - Set tournament state to 'draft'
   - No completed results (tournament hasn't started)
   - Draft status: started but empty (no selections made)

4. **Generate Pre-draft Tournament Data (Events 5-9)**
   - Generate golfer list with ranks
   - Set tournament state to 'pre-draft'
   - No results, no draft data

### Step 2: Update Tournament Picker Component
**File**: `FrontEnd/components/tournament/TournamentPicker.tsx` (if exists) or `draft-page-web.html`

1. **Populate Tournament List**
   - Load all 9 tournaments from dummy data
   - Display tournament name and date range
   - Mark current tournament (U.S. OPEN) appropriately

2. **Handle Tournament Selection**
   - When selecting a completed tournament: show results view
   - When selecting current tournament: show draft view
   - When selecting future tournament: show pre-draft view

### Step 3: Update Draft Page Logic
**File**: `draft-page-web.html` or corresponding React component

1. **State Detection**
   - Determine tournament state from dummy data
   - Show appropriate UI based on state:
     - **Completed**: Show results table/list, hide draft controls
     - **Draft**: Show draft table, draft banner, selection buttons
     - **Pre-draft**: Show pre-draft banner, hide draft controls

2. **Draft Display**
   - For completed tournaments: show final draft selections
   - For current tournament: show empty draft (no selections yet)
   - For pre-draft: show message that draft hasn't started

3. **Results Display**
   - For completed tournaments: show final scores, positions, points
   - For current/future tournaments: show "Tournament not completed" or similar

### Step 4: Update List/Table Views
**Files**: `tournament-list-view-web.html`, `tournament-table-view-web.html` (or React equivalents)

1. **Completed Tournaments**
   - Display final results in both list and table views
   - Show golfer positions, scores, points
   - Show team standings

2. **Current Tournament**
   - Display draft state in both views
   - Show available golfers for selection
   - Show draft progress (empty since no selections made)

3. **Pre-draft Tournaments**
   - Display pre-draft state
   - Show golfer list but indicate draft hasn't started

### Step 5: Data Access Layer
**File**: `FrontEnd/lib/dummyData.ts` (or create new utility)

1. **Create Helper Functions**
   - `getTournamentById(id: string)`: Get tournament data
   - `getCurrentTournament()`: Get the current tournament (U.S. OPEN)
   - `getCompletedTournaments()`: Get all completed tournaments
   - `getUpcomingTournaments()`: Get all pre-draft tournaments
   - `getTournamentState(tournamentId: string)`: Get tournament state

2. **State Calculation Logic**
   - Compare current date with tournament dates
   - Determine if draft has started
   - Determine if tournament is completed

### Step 6: Testing Checklist
- [ ] All 9 tournaments appear in tournament picker
- [ ] Tournament dates are correct (1st-4th of each month)
- [ ] First 3 tournaments show completed results
- [ ] First 3 tournaments show completed drafts
- [ ] U.S. OPEN (Event 4) shows as current tournament
- [ ] U.S. OPEN shows draft state (empty draft)
- [ ] Events 5-9 show pre-draft state
- [ ] List view works for all tournament states
- [ ] Table view works for all tournament states
- [ ] Tournament selector allows switching between tournaments
- [ ] State-specific UI elements display correctly

## Data Format Examples

### Completed Tournament Example (Event 1)
```typescript
{
  id: '1',
  name: 'PLAYERS CHAMPIONSHIP',
  dateRange: 'FEB 01 - 04, 2026',
  state: 'completed',
  startDate: '2026-02-01',
  endDate: '2026-02-04',
  // Full results, drafts, scores available
}
```

### Current Tournament Example (Event 4)
```typescript
{
  id: '4',
  name: 'U.S. OPEN',
  dateRange: 'MAY 01 - 04, 2026',
  state: 'draft',
  draftStartDate: '2026-04-28', // Draft started before tournament
  startDate: '2026-05-01',
  endDate: '2026-05-04',
  // Golfers available, but no draft selections yet
}
```

### Pre-draft Tournament Example (Event 5)
```typescript
{
  id: '5',
  name: 'OPEN CHAMPIONSHIP',
  dateRange: 'JUN 01 - 04, 2026',
  state: 'pre-draft',
  draftStartDate: '2026-05-28', // Future date
  startDate: '2026-06-01',
  endDate: '2026-06-04',
  // Golfers available, but draft hasn't started
}
```

## Notes
- All dates should use 2026 as the year
- Tournament states should be calculated based on current date logic
- For testing, we can use a fixed "current date" to simulate being in May 2026
- Ensure all dummy data is deterministic for consistent testing
- Consider adding a "test mode" flag to control which tournament is considered "current"
