# Major Pain Fantasy Golf - Frontend

Next.js frontend application for the Major Pain Fantasy Golf game.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
FrontEnd/
├── app/                    # Next.js App Router pages
│   ├── draft/             # Draft page
│   ├── tournament/         # Tournament views
│   ├── season/             # Season standings
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── layout/             # Layout components (Header, BackgroundImage, etc.)
│   ├── navigation/         # Navigation components
│   ├── ui/                 # Reusable UI primitives
│   ├── tournament/         # Tournament-specific components
│   ├── draft/              # Draft table components
│   ├── modal/              # Modal components
│   └── season/             # Season view components
├── lib/                     # Utilities and types
│   ├── types.ts            # TypeScript type definitions
│   ├── constants.ts        # Game constants
│   └── utils.ts            # Utility functions
└── public/                  # Static assets
    └── images/             # Image files
```

## Key Features

- **Draft Page** (`/draft`): Interactive draft table with sorting and selection
- **Tournament Views** (`/tournament/[id]`): Tournament detail pages with list/table views
- **Season Standings** (`/season`): Season leaderboard
- **Reusable Components**: Well-structured component library for consistent UI

## Component Architecture

### Layout Components
- `Header`: Main navigation header with logo and controls
- `BackgroundImage`: Tournament background with opacity overlay
- `MainContainer`: Content wrapper with proper positioning

### UI Primitives
- `Button`: Base button with variants (primary, secondary, ghost)
- `Modal`: Reusable modal wrapper
- `ProfilePicture`: User/golfer profile picture component
- `Stripe`: Decorative stripe component
- `Logo`: Major Pain logo component
- `Divider`: Vertical divider line

### Draft Components
- `DraftTable`: Main table with sorting functionality
- `DraftTableColumn`: Column wrapper
- `DraftTableCell`: Individual table cell
- `DraftTableHeader`: Sortable table header
- `GolferRow`: Complete golfer row
- `DraftSelectButton`: SELECT button for draft actions

### Tournament Components
- `TournamentPicker`: Dropdown tournament selector
- `DraftBanner`: "Player has next pick" banner
- `PlayByPlay`: Scrollable play-by-play log

## Styling

The project uses:
- **Tailwind CSS** for utility classes
- **CSS Variables** for theming (defined in `globals.css`)
- **Inline Styles** for component-specific styling matching the original HTML design

## TypeScript

All components are fully typed with TypeScript. Type definitions are in `lib/types.ts`.

## Next Steps

1. Connect to backend API for real data
2. Add authentication
3. Implement real-time updates with WebSockets
4. Add more tournament views and features
5. Mobile responsive optimizations

## Documentation

- **[DRAFT_SYSTEM.md](../DRAFT_SYSTEM.md)** – Draft system architecture, API routes, save behavior, and implementation notes

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
