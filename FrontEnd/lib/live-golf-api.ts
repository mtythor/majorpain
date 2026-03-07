/**
 * Live Golf API client - fetches tournament field from RapidAPI Live Golf Data.
 * Used when fieldSource is 'live' and state has no golfers.
 */

import type { Golfer } from './types';

const BASE_URL = 'https://live-golf-data.p.rapidapi.com';
const ORG_ID = '1'; // PGA Tour
/** statId=186 = Official World Golf Ranking */
const OWGR_STAT_ID = '186';

/** OWGR cache TTL: 7 days. Rankings change weekly as tournaments are played. */
const OWGR_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** In-memory cache: year -> { map, cachedAt }. Reused across imports; refreshed after TTL. */
const owgrCacheByYear = new Map<string, { map: Map<string, number>; cachedAt: number }>();

/**
 * Major Pain tournament id -> { tournId, year } for RapidAPI.
 * tournIds from GET /schedule?orgId=1&year=2026 (live-golf-data.p.rapidapi.com).
 * Exported for import-field route to record API params in fieldMeta.
 */
export const LIVE_API_TOURNAMENT_MAP: Record<string, { tournId: string; year: string }> = {
  '1': { tournId: '011', year: '2026' }, // THE PLAYERS Championship
  '2': { tournId: '014', year: '2026' }, // Masters Tournament
  '3': { tournId: '033', year: '2026' }, // PGA Championship
  '4': { tournId: '026', year: '2026' }, // U.S. Open
  '5': { tournId: '100', year: '2026' }, // The Open Championship
  '6': { tournId: '027', year: '2026' }, // FedEx St. Jude Championship
  '7': { tournId: '028', year: '2026' }, // BMW Championship
  '8': { tournId: '060', year: '2026' }, // TOUR Championship
  '9': { tournId: '500', year: '2026' }, // Presidents Cup
};

function getApiKey(): string {
  return (process.env.RAPIDAPI_KEY || '').trim();
}

async function fetchFromApi(
  path: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const key = getApiKey();
  if (!key) {
    throw new Error('RAPIDAPI_KEY is not configured');
  }
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'live-golf-data.p.rapidapi.com',
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

/** Fetch OWGR rankings: playerId -> rank. Returns empty map on failure. Cached per year, TTL 7 days. */
async function fetchOwgrRankings(year: string): Promise<Map<string, number>> {
  const cached = owgrCacheByYear.get(year);
  if (cached && Date.now() - cached.cachedAt < OWGR_CACHE_TTL_MS) return cached.map;

  const map = new Map<string, number>();
  try {
    const data = await fetchFromApi('/stats', {
      year,
      statId: OWGR_STAT_ID,
    });
    const rankings =
      Array.isArray(data?.rankings) ? data.rankings
      : Array.isArray(data?.ranking) ? data.ranking
      : [];
    for (const r of rankings as Array<{ playerId?: string | number; player_id?: string | number; rank?: number | string | { $numberInt?: string; $numberLong?: string } }>) {
      const pidRaw = r.playerId ?? r.player_id;
      const pid = pidRaw != null ? String(pidRaw).trim() : null;
      const rankVal = r.rank;
      let rank: number;
      if (typeof rankVal === 'number') {
        rank = rankVal;
      } else if (typeof rankVal === 'string') {
        rank = parseInt(rankVal, 10);
      } else if (rankVal && typeof rankVal === 'object' && ('$numberInt' in rankVal || '$numberLong' in rankVal)) {
        const s = (rankVal as { $numberInt?: string; $numberLong?: string }).$numberInt ?? (rankVal as { $numberLong?: string }).$numberLong;
        rank = typeof s === 'string' ? parseInt(s, 10) : NaN;
      } else {
        rank = NaN;
      }
      if (pid && typeof rank === 'number' && !Number.isNaN(rank) && rank > 0) {
        map.set(pid, rank);
      }
    }
  } catch (e) {
    console.warn('[live-golf-api] OWGR fetch failed, using rank 999 for all:', e instanceof Error ? e.message : e);
  }
  if (map.size === 0) {
    console.warn('[live-golf-api] OWGR map is empty - stats API may have returned no rankings');
  }
  owgrCacheByYear.set(year, { map, cachedAt: Date.now() });
  return map;
}

function mapLiveApiPlayerToGolfer(
  p: Record<string, unknown>,
  index: number,
  owgrByPlayerId: Map<string, number>
): Golfer {
  const first = p.firstName ?? p.first_name ?? '';
  const last = p.lastName ?? p.last_name ?? p.name ?? '';
  const name = [first, last].filter(Boolean).join(' ').trim() || String(p.name ?? `Player ${index + 1}`);
  const id = String(p.playerId ?? p.id ?? p.golferId ?? p.player_id ?? `live-${index}`).trim();
  const owgr = owgrByPlayerId.get(id)
    ?? (id && /^\d+$/.test(id) ? owgrByPlayerId.get(String(parseInt(id, 10))) : undefined);
  const rank = typeof owgr === 'number' && !Number.isNaN(owgr) && owgr > 0 ? owgr : 999;
  const imageUrl = typeof p.imageUrl === 'string' ? p.imageUrl
    : typeof p.avatarUrl === 'string' ? p.avatarUrl
    : undefined;
  return { id: id || `live-${index}`, name, rank, imageUrl };
}

/**
 * Fetch tournament field from live API and map to Golfer[].
 * Uses GET /tournament?orgId=1&tournId=&year= (RapidAPI Live Golf Data).
 * Response: { players: [{ firstName, lastName, playerId, isAmateur }] }
 * Throws with a descriptive message on failure.
 */
export async function fetchTournamentField(tournamentId: string): Promise<Golfer[]> {
  const mapping = LIVE_API_TOURNAMENT_MAP[tournamentId];
  if (!mapping) {
    throw new Error(`No live API mapping for tournament ${tournamentId}. Add it to LIVE_API_TOURNAMENT_MAP.`);
  }

  const { tournId, year } = mapping;

  let data: Record<string, unknown>;
  try {
    data = await fetchFromApi('/tournament', {
      orgId: ORG_ID,
      tournId,
      year,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Live API request failed (tournId=${tournId}, year=${year}): ${msg}`);
  }

  const players = (Array.isArray(data?.players) ? data.players : []) as Array<Record<string, unknown>>;

  if (players.length === 0) {
    throw new Error(
      `Live API returned no players for this tournament (tournId=${tournId}, year=${year}). The field may not be published yet.`
    );
  }

  const owgrByPlayerId = await fetchOwgrRankings(year);
  return players.map((p, i) => mapLiveApiPlayerToGolfer(p, i, owgrByPlayerId));
}
