/**
 * Parse odds string (e.g., "3 / 1") and return the first number for sorting
 */
export function parseOdds(odds: string): number {
  const match = odds.match(/(\d+)\s*\/\s*\d+/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start.toUpperCase()} - ${end.toUpperCase()}`;
}

/**
 * Get row class for alternating colors
 */
export function getRowClass(index: number): 'standard-row' | 'alt-row' {
  return index % 2 === 0 ? 'standard-row' : 'alt-row';
}
