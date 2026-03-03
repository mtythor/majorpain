import { DraftEvent } from './types';

export interface DraftPick {
  pickNumber: number;
  playerId: string;
  golferId: string;
  pickType: 'active' | 'alternate';
}

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
