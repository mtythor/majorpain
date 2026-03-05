export interface Golfer {
  id: string;
  name: string;
  rank: number;
  imageUrl?: string;
}

export interface DraftStatus {
  golferId: string;
  draftedBy?: string;
  draftedByImage?: string;
  isSelectable: boolean;
}

export type TournamentState = 'pre-draft' | 'draft' | 'playing' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  dateRange: string;
  backgroundImage: string;
  draftStartDate?: string; // ISO date string for when draft starts
  startDate?: string; // ISO date string for when tournament starts
  endDate?: string; // ISO date string for when tournament ends
  state?: TournamentState; // Current state of the tournament
  cutLineScore?: number; // Score relative to par for cut line (e.g., +4 means golfers at +4 or better make cut). Omit for no-cut events.
  venue?: {
    name: string; // Course name
    par: number; // Course par
    location: string; // City, State/Country
  };
}

export interface Player {
  id: string;
  name: string;
  imageUrl: string;
}

export interface DraftEvent {
  type: 'steal' | 'select';
  playerName: string;
  golferName: string;
  golferRank: number;
  timestamp: Date;
}

export type ViewMode = 'tournament' | 'season' | 'admin';
export type TableViewMode = 'list' | 'table';
export type SortDirection = 'asc' | 'desc' | null;
export type SortColumn = 'rank' | null;

// Tournament result types
export interface RoundScore {
  round: number;
  score: number; // Strokes for the round (e.g., 68, 72, etc.)
  toPar: number; // Score relative to par (e.g., -4, +2, etc.)
}

export type GolferResultStatus = 'active' | 'cut' | 'withdrawn';

export interface GolferTournamentResult {
  golferId: string;
  finalPosition: number | null; // null if missed cut
  rounds: RoundScore[];
  totalScore: number; // Total strokes
  totalToPar: number; // Total score relative to par
  madeCut: boolean;
  /** WD = withdrew (e.g. injury). Treated like cut for alternate substitution. */
  status?: GolferResultStatus;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export interface TeamDraft {
  playerId: string;
  activeGolfers: string[]; // 3 golfer IDs
  alternateGolfer: string; // 1 golfer ID
  substitutions?: Array<{
    round: number;
    replacedGolferId: string;
    replacementGolferId: string;
  }>;
}

export interface TournamentResult {
  tournamentId: string;
  fatRandoStolenGolfers: string[]; // 4 golfer IDs
  teamDrafts: TeamDraft[];
  golferResults: GolferTournamentResult[];
  teamScores: Array<{
    playerId: string;
    totalPoints: number;
    golferPoints: Array<{
      golferId: string;
      points: number;
    }>;
  }>;
}
