/**
 * Design tokens - layout values from Figma spec.
 * Keep in sync with CSS variables in globals.css (:root).
 * Used by components that need these values in JS (e.g. media queries, dynamic styles).
 */

export const BREAKPOINTS = {
  /** Mobile layout - matches Tailwind md and globals.css */
  mobile: 768,
  /** Desktop layout for tournament picker, list padding */
  desktopPicker: 816,
} as const;

export const LAYOUT = {
  maxContentWidth: 1006,
  tableWidth: 790,
  tournamentListWidth: 800,
  tournamentListWidthHalf: 400,
} as const;

export const HEADER = {
  stripeOffset: 277,
  stripeWidth: 390,
  stripeTop: 47,
} as const;

export const PICKER_OFFSETS = {
  list: 400,
  draft: 503,
  table: 528.5,
} as const;

export const RESULTS = {
  headerOffsetX: 395,
  colPos: 92,
  colPlayer: 238,
  colScore: 92,
} as const;

/** Media query for mobile - viewports below 768px. Matches globals.css and Tailwind md boundary. */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)' as const;
