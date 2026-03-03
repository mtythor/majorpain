// Game constants based on GameRules.md

export const SCORING = {
  BASE_POINTS_FORMULA: (position: number) => 100 - position,
  BONUS_POINTS: {
    FIRST_PLACE: 6,
    TOP_5: 5, // 2nd-5th
    TOP_10: 4, // 6th-10th
    TOP_20: 3, // 11th-20th
    BELOW_20: 0,
  },
  MISSED_CUT: 0,
} as const;

/** Compute points from position (used for partial results when rounds are entered but no final position) */
export function pointsFromPosition(position: number): { basePoints: number; bonusPoints: number; totalPoints: number } {
  const basePoints = SCORING.BASE_POINTS_FORMULA(position);
  let bonusPoints = 0;
  if (position === 1) bonusPoints = SCORING.BONUS_POINTS.FIRST_PLACE;
  else if (position >= 2 && position <= 5) bonusPoints = SCORING.BONUS_POINTS.TOP_5;
  else if (position >= 6 && position <= 10) bonusPoints = SCORING.BONUS_POINTS.TOP_10;
  else if (position >= 11 && position <= 20) bonusPoints = SCORING.BONUS_POINTS.TOP_20;
  return { basePoints, bonusPoints, totalPoints: basePoints + bonusPoints };
}

export const RYDER_CUP_SCORING = {
  SINGLES_WIN: 25,
  SINGLES_HALVED: 10,
  SINGLES_LOSS: 0,
  PAIRS_WIN: 20,
  PAIRS_HALVED: 10,
  PAIRS_LOSS: 0,
  HIGH_PARTICIPATION_BONUS: 5, // 4+ pairs matches
  UNDEFEATED_WEEKEND_BONUS: 10,
  CUP_CLINCHER_BONUS: 15,
} as const;

export const DRAFT_CONFIG = {
  STANDARD_ACTIVE_GOLFERS: 3,
  STANDARD_ALTERNATES: 1,
  FAT_RANDO_STEALS: 4,
} as const;
