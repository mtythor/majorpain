# Major Pain Fantasy Golf - Complete Game Rules

## Overview
Major Pain Fantasy Golf is a fantasy sports game played by 2-4 players during major golf tournaments. The game combines strategic drafting, real-time scoring, and tournament management to create an engaging fantasy golf experience.

## Game Structure

### Players
- **2-4 Human Players** - Active participants who draft teams and compete
- **Fat Rando** - Automated bot that adds randomness by "stealing" golfers before the draft

### Tournament Schedule
The game runs during major golf tournaments throughout the year, including:
- The Players Championship
- The Masters
- PGA Championship
- US Open
- The Open Championship
- FedEx Cup Playoffs (3 events)
- Ryder Cup (special format)

## Team Composition

### Standard Tournaments
Each player drafts:
- **3 active golfers** - Primary scoring golfers
- **1 alternate** - Backup golfer for cut protection

### Ryder Cup Format
Each player drafts:
- **2 Players**: 12 golfers total (6 USA + 6 Europe)
- **3 Players**: 8 golfers total (4 USA + 4 Europe)  
- **4 Players**: 6 golfers total (3 USA + 3 Europe)
- **No alternates** - All drafted golfers are active
- **Fat Rando inactive** - No golfers removed from draft pool

## Draft System

### Draft Format
- **Snake Draft** - Previous week's winner picks first
- **Order**: Winner → 2nd → 3rd → 4th → 4th → 3rd → 2nd → 1st (repeats for 4 players)
- **4 picks per player** (3 active golfers + 1 alternate)
- **Ryder Cup picks vary by player count**:
  - **2 Players**: 12 picks each (6 USA + 6 Europe)
  - **3 Players**: 8 picks each (4 USA + 4 Europe)
  - **4 Players**: 6 picks each (3 USA + 3 Europe)
- **Draft order adjusts automatically** based on number of players (2-4)

### Fat Rando Bot
Before the draft begins, Fat Rando automatically "steals" 4 golfers from the available pool using a progressive random selection process:

#### Stealing Process:
1. **Golfers sorted by world rank** - Field ranked from #1 (best) to last
2. **Steal #1**: Random number 1-5, steals golfer at that position
3. **Steal #2**: Random number 1-10, steals golfer at that position (remaining field)
4. **Steal #3**: Random number 1-15, steals golfer at that position (remaining field)
5. **Steal #4**: Random number 1-20, steals golfer at that position (remaining field)
6. **Field adjusts** - Remaining golfers move up to fill gaps, maintaining odds-based order

#### Key Features:
- **Adds unpredictability and variability** - Can steal favorites or longshots
- **Removes these golfers from draft selection** - Forces strategic adaptation
- **Standard Tournaments Only** - Fat Rando is active
- **Ryder Cup**: Fat Rando is inactive - no golfers removed
- **Not a competing player** - only serves to add randomness to the draft

#### Performance Tracking:
- **Fat Rando's scores are tracked** for comparison and entertainment
- **Shows how random selection performs** against strategic human drafting
- **Displayed separately** from human player standings
- **For interest only** - does not affect draft order or season standings

## Scoring System

### Standard Tournament Scoring

#### Base Points
- **Formula**: `100 - Final Position`
- **Examples**:
  - 1st place: 99 points
  - 2nd place: 98 points
  - 4th place: 96 points
  - 7th place: 93 points
  - 10th place: 90 points
  - 16th place: 84 points
  - 20th place: 80 points
  - 30th place: 70 points
  - 34th place: 66 points

#### Bonus Points
- **1st Place**: +6 bonus points
- **Top 5 (2nd-5th)**: +5 bonus points
- **Top 10 (6th-10th)**: +4 bonus points
- **Top 20 (11th-20th)**: +3 bonus points
- **Below 20th**: 0 bonus points

#### Total Points Examples
- **1st place**: 99 + 6 = 105 points
- **2nd place**: 98 + 5 = 103 points
- **4th place**: 96 + 5 = 101 points
- **7th place**: 93 + 4 = 97 points
- **10th place**: 90 + 4 = 94 points
- **16th place**: 84 + 3 = 87 points
- **20th place**: 80 + 3 = 83 points
- **30th place**: 70 + 0 = 70 points
- **Missed Cut**: 0 points

#### Missed Cut
- **Cut Golfers**: 0 points total (no base points, no bonus)
- **Automatic Substitution**: Alternate golfer replaces cut golfers

### Ryder Cup Scoring

#### Match Points
- **Singles Win**: 25 points
- **Singles Halved**: 10 points
- **Singles Loss**: 0 points
- **Pairs Win**: 20 points
- **Pairs Halved**: 10 points
- **Pairs Loss**: 0 points

#### Bonus Points
- **High Participation** (4+ pairs matches): +5 points
- **Undefeated Weekend**: +10 points (no losses, regardless of number of matches played; halved matches are not losses)
- **Cup Clincher**: +15 points (golfer who puts their team at the 14.5 point mark)

#### Ryder Cup Scoring Scale
- **Target Range**: 200-300 points (matching regular tournament scale)
- **Strong Performance**: Golfer going 4-0 in matches scores ~100+ points
- **Team Total**: Sum of all drafted golfers' individual points
- **Scoring Philosophy**: Similar point values to top-10 finish in stroke play

## Team Management

### Cut Protection
- **Standard Tournaments**: If an active golfer misses the cut, the alternate automatically replaces them
- **Ryder Cup**: No alternates - all drafted golfers remain active regardless of performance
- Alternate must have made the cut to be available for substitution

### Alternate Substitution Options
- **Automatic Cut Protection**: Alternate replaces any golfer who misses the cut
- **Voluntary Substitution**: After Round 2, players may substitute their alternate for any active golfer
- **No Cut Events**: Players may substitute alternate for any golfer after Round 2
- **Fat Rando Substitution**: If Fat Rando's alternate is available, he automatically substitutes for the golfer with the worst position after Round 2


### Team Scoring
- **Total Points**: Sum of all active golfers' points (base + bonus)
- **Ranking**: Teams ranked by total points (highest first)
- **Fat Rando Tracking**: Scores calculated and displayed separately for comparison


## Season Structure

### Regular Season
- Multiple major tournaments
- Cumulative points tracking
- Weekly winner determines next draft order

### Season Standings
- **Total Points**: Sum of all tournament scores
- **Average Points**: Total ÷ number of tournaments played (unplayed tournaments excluded)
- **Leaderboard**: Players ranked by total points (average points displayed for info only)


## Key Features

### Real-Time Updates
- Live scoring from PGA leaderboards
- Automatic score updates after each round
- Real-time team standings

### Strategic Elements
- Draft order based on previous performance
- Fat Rando adds unpredictability
- Cut protection with alternates
- Strategic substitution options
- Bonus point tiers create meaningful differentiation

### Technology Stack
- **Web Interface**: Next.js with React
- **Mobile App**: React Native (planned)
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSocket connections (planned)
- **Live Data**: PGA Tour API integration (planned)

## Historical Context

### Typical Performance Ranges
- **Tournament Scores**: Typically range from 150-270 points
- **High Scores**: 300+ points represents excellent performance
- **Close Competition**: Tight races between players are common
- **Strategic Elements**: Use of alternates for cut protection creates exciting finishes

### Notable Game Features
- Strategic use of alternates for cut protection
- Exciting Sunday leaderboard moves affecting bonus tiers
- Close finishes between players create dramatic moments
- Example tournament results show competitive balance:
  - Winner: 261 points
  - 2nd Place: 261 points (tied)
  - 3rd Place: 258 points
  - 4th Place: 220 points
  - 5th Place: 211 points

## Future Enhancements

### Planned Features
- Mobile app development
- User authentication system
- API endpoints for all functionality
- PGA Tour API integration
- Real-time WebSocket updates
- Advanced analytics and statistics
- **Forecasting system** - Predict tournament results based on golfer performance as rounds progress
- **Player profiles** - Upload/change profile pictures, names, and personal information

### Ryder Cup Integration
- Special scoring system implemented
- Team-based draft format
- Match play point structure
- Bonus system for key performances

### Development & Testing
- **Mock dataset** - Test field of 100 golfers with realistic rankings
- **Mock draft simulation** - Generate automated drafts to test system functionality
- **Mock tournament results** - Simulate complete tournaments with realistic scoring
- **Pre/post tournament testing** - Verify all scoring, substitution, and ranking systems work correctly
- **Fat Rando testing** - Validate random selection and scoring algorithms
- **Performance validation** - Ensure all game mechanics function as designed

## Game Philosophy

Major Pain Fantasy Golf combines the excitement of fantasy sports with the strategic depth of golf tournament management. The game rewards both consistent performance and clutch moments, with the bonus structure making every position in the top 20 meaningful. The Fat Rando element adds unpredictability, while the cut protection system ensures every team remains competitive throughout the tournament.

### What Makes This Game Unique
- **Fat Rando Automation**: Adds strategic unpredictability by removing 4 golfers before drafting
- **Cut Protection**: Automatic alternate substitution keeps teams competitive
- **Dual Scoring System**: Base points reward consistency, bonuses reward excellence
- **Strategic Substitutions**: Manual golfer swaps add tactical depth
- **Ryder Cup Integration**: Special match play scoring maintains competitive balance
- **Snake Draft Order**: Previous week's winner picks first, creating ongoing competition

### Key Strategic Elements
- **Draft Strategy**: Balance between safe picks and high-upside golfers
- **Cut Management**: Choosing alternates who are likely to make cuts
- **Substitution Timing**: Knowing when to stick with picks vs. making changes
- **Bonus Optimization**: Targeting golfers who can reach higher bonus tiers
- **Tournament Selection**: Understanding which events favor different golfer types

The game's success lies in its balance of skill (drafting, strategy) and luck (Fat Rando, tournament outcomes), creating an engaging experience that keeps all participants invested from draft day through the final putt.
