# Data ID Naming Convention

This document outlines the unique ID naming convention used throughout the HTML files to identify data points that will be populated from dummy data (and eventually from the database).

## Overview

All data attributes use the `data-*` prefix to maintain HTML5 validity. The naming convention follows a hierarchical pattern: `data-[entity]-[property]` or `data-[entity]-[property]-[subproperty]`.

## Tournament Data

### Tournament Picker
- `data-tournament-name` - Tournament name displayed in picker header
- `data-tournament-date` - Tournament date range displayed in picker header
- `data-tournament-option-id` - Tournament ID for dropdown options (values: "1" through "9")
- `data-tournament-option-name` - Tournament name in dropdown option
- `data-tournament-option-date` - Tournament date in dropdown option

## Player Data

### Player Cards/Tables
- `data-player-card-id` - Unique ID for player card (values: "1" through "5")
- `data-player-table-id` - Unique ID for player table (values: "1" through "5")
- `data-player-name` - Player name
- `data-player-image` - Player profile image source
- `data-player-avg-pos` - Player's average position
- `data-player-points` - Player's total points
- `data-player-bonus` - Player's bonus points
- `data-player-total` - Player's total score
- `data-player-strokes-total` - Player's total strokes (to par)

## Golfer Data

### Golfer Rows in Draft Table
- `data-golfer-row` - Row index for golfer in draft table (0-based)
- `data-golfer-name` - Golfer name
- `data-golfer-rank` - Golfer's rank
- `data-golfer-odds` - Golfer's betting odds (format: "X / Y")
- `data-draft-selection` - Indicates a draft selection cell
- `data-draft-player-image` - Player image in draft selection

### Golfer Tags in Player Cards
- `data-golfer-tag-index` - Index of golfer tag (0-3: active golfers, 3: alternate)
- `data-golfer-position-name` - Golfer position and name (format: "POS: Name")

### Golfer Data in Player Tables
- `data-golfer-row` - Row index for golfer (0-3: active golfers, 3: alternate)
- `data-golfer-name` - Golfer name
- `data-golfer-position` - Golfer's final position (or "ALT" for alternate)
- `data-golfer-strokes` - Golfer's total strokes (to par)
- `data-golfer-round` - Round score (values: "1", "2", "3", "4")
- `data-golfer-points` - Golfer's base points
- `data-golfer-bonus` - Golfer's bonus points
- `data-golfer-total` - Golfer's total points

## Draft Data

### Draft Banner
- `data-draft-banner-player-name` - Name of player who has the next pick

### Play-by-Play
- `data-playbyplay-index` - Index of play-by-play entry (0-based)
- `data-playbyplay-player-name` - Player name in play-by-play entry
- `data-playbyplay-golfer-rank` - Golfer rank in play-by-play entry
- `data-playbyplay-golfer-name` - Golfer name in play-by-play entry
- `data-playbyplay-separator` - Separator line in play-by-play

## Season Data

### Season Picker
- `data-season-picker-text` - Season text (e.g., "2026 SEASON")

### Season Table
- `data-season-tournament-id` - Tournament ID in season table header (values: "1" through "9")
- `data-season-player-id` - Player ID in season row (values: "1" through "5")
- `data-season-tournament-score` - Player's score for specific tournament
- `data-season-avg-score` - Player's season average score
- `data-season-total-points` - Player's total season points

## Usage Examples

### Finding a Tournament Name
```javascript
const tournamentName = document.querySelector('[data-tournament-name]').textContent;
```

### Finding All Golfer Names in Draft Table
```javascript
const golferNames = Array.from(document.querySelectorAll('[data-golfer-name]'))
    .map(el => el.textContent);
```

### Finding Player Scores
```javascript
const playerPoints = document.querySelector('[data-player-card-id="1"] [data-player-points]').textContent;
```

### Finding Golfer Round Scores
```javascript
const round1Scores = Array.from(document.querySelectorAll('[data-golfer-round="1"]'))
    .map(el => el.textContent);
```

## Notes

1. **Row Indices**: Golfer row indices are 0-based and consistent across columns in the same table
2. **Player IDs**: Player IDs map to dummy data:
   - "1" = MtyThor
   - "2" = KristaKay
   - "3" = MrHattyHat
   - "4" = Atticus
   - "5" = Fat Rando
3. **Tournament IDs**: Tournament IDs map to dummy data:
   - "1" = PLAYERS CHAMPIONSHIP
   - "2" = THE MASTERS
   - "3" = PGA CHAMPIONSHIP
   - "4" = U.S. OPEN
   - "5" = OPEN CHAMPIONSHIP
   - "6" = FEDEX ST. JUDE
   - "7" = BMW CHAMPIONSHIP
   - "8" = TOUR CHAMPIONSHIP
   - "9" = RYDER CUP

## Files Updated

- ✅ `draft-page-web.html` - Tournament picker, draft banner, golfer table, draft selections, play-by-play
- ✅ `tournament-list-view-web.html` - Tournament picker, player cards, golfer tags
- ⚠️ `tournament-table-view-web.html` - Tournament picker, first player table (pattern established for remaining tables)
- ⏳ `season-view-web.html` - To be updated

## Next Steps

1. Apply the same ID pattern to remaining player tables in `tournament-table-view-web.html`
2. Add IDs to `season-view-web.html` for season standings
3. Create JavaScript functions to populate these elements from dummy data
4. Test data population with all IDs
