/**
 * 2026 tournament schedule - the fixed set of events for the season.
 * This is the canonical source for tournament metadata (dates, venues, cut rules).
 * Not dummy data - these are the actual scheduled events.
 */

import type { Tournament } from './types';

/** 2026 season schedule - draft start = Monday of tournament week. State is date-based unless admin overrides. */
export const TOURNAMENT_SCHEDULE_2026: Tournament[] = [
  {
    id: '1',
    name: 'PLAYERS CHAMPIONSHIP',
    dateRange: 'MAR 12 - 15, 2026',
    backgroundImage: '/images/TPC-Sawgrass.jpg',
    draftStartDate: '2026-03-09',
    startDate: '2026-03-12',
    endDate: '2026-03-15',
    cutLineScore: 4,
    venue: {
      name: 'TPC Sawgrass',
      par: 72,
      location: 'Ponte Vedra Beach, Florida',
    },
  },
  {
    id: '2',
    name: 'THE MASTERS',
    dateRange: 'APR 09 - 12, 2026',
    backgroundImage: '/images/Augusta.jpg',
    draftStartDate: '2026-04-06',
    startDate: '2026-04-09',
    endDate: '2026-04-12',
    cutLineScore: 4,
    venue: {
      name: 'Augusta National Golf Club',
      par: 72,
      location: 'Augusta, Georgia',
    },
  },
  {
    id: '3',
    name: 'PGA CHAMPIONSHIP',
    dateRange: 'MAY 14 - 17, 2026',
    backgroundImage: '/images/Aronimink.jpg',
    draftStartDate: '2026-05-11',
    startDate: '2026-05-14',
    endDate: '2026-05-17',
    cutLineScore: 4,
    venue: {
      name: 'Aronimink Golf Club',
      par: 72,
      location: 'Newtown Square, Pennsylvania',
    },
  },
  {
    id: '4',
    name: 'U.S. OPEN',
    dateRange: 'JUN 18 - 21, 2026',
    backgroundImage: '/images/Shinnecock-Hills.jpg',
    draftStartDate: '2026-06-15',
    startDate: '2026-06-18',
    endDate: '2026-06-21',
    cutLineScore: 5,
    venue: {
      name: 'Shinnecock Hills Golf Club',
      par: 70,
      location: 'Southampton, New York',
    },
  },
  {
    id: '5',
    name: 'OPEN CHAMPIONSHIP',
    dateRange: 'JUL 16 - 19, 2026',
    backgroundImage: '/images/Royal-Birkdale.jpg',
    draftStartDate: '2026-07-13',
    startDate: '2026-07-16',
    endDate: '2026-07-19',
    cutLineScore: 4,
    venue: {
      name: 'Royal Birkdale',
      par: 71,
      location: 'Southport, England',
    },
  },
  {
    id: '6',
    name: 'FEDEX ST. JUDE',
    dateRange: 'AUG 13 - 16, 2026',
    backgroundImage: '/images/TPC-Southwind.jpg',
    draftStartDate: '2026-08-10',
    startDate: '2026-08-13',
    endDate: '2026-08-16',
    cutLineScore: 4,
    venue: {
      name: 'TPC Southwind',
      par: 70,
      location: 'Memphis, Tennessee',
    },
  },
  {
    id: '7',
    name: 'BMW CHAMPIONSHIP',
    dateRange: 'AUG 20 - 23, 2026',
    backgroundImage: '/images/Bellerive.jpg',
    draftStartDate: '2026-08-17',
    startDate: '2026-08-20',
    endDate: '2026-08-23',
    cutLineScore: 4,
    venue: {
      name: 'Bellerive Country Club',
      par: 72,
      location: 'St. Louis, Missouri',
    },
  },
  {
    id: '8',
    name: 'TOUR CHAMPIONSHIP',
    dateRange: 'AUG 27 - 30, 2026',
    backgroundImage: '/images/East-Lake.jpg',
    draftStartDate: '2026-08-24',
    startDate: '2026-08-27',
    endDate: '2026-08-30',
    venue: {
      name: 'East Lake Golf Club',
      par: 70,
      location: 'Atlanta, Georgia',
    },
  },
  {
    id: '9',
    name: "PRESIDENT'S CUP",
    dateRange: 'SEP 24 - 27, 2026',
    backgroundImage: '/images/Medinah.jpg',
    draftStartDate: '2026-09-21',
    startDate: '2026-09-24',
    endDate: '2026-09-27',
    venue: {
      name: 'Medinah Country Club',
      par: 72,
      location: 'Medinah, Illinois',
    },
  },
];

/**
 * Merge: schedule provides dates/venues, stored provides admin state override.
 * State is date-based by default (getTournamentState); admin override takes precedence.
 */
export function mergeTournamentsWithSchedule(
  existing: Array<{ id: string; state?: string }> = []
): Tournament[] {
  const existingById = new Map(existing.map((t) => [t.id, t]));
  return TOURNAMENT_SCHEDULE_2026.map((canonical) => ({
    ...canonical,
    state: existingById.get(canonical.id)?.state as Tournament['state'] | undefined,
  }));
}
