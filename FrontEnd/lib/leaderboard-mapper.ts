/**
 * Maps RapidAPI leaderboard response to Major Pain GolferTournamentResult[].
 * API-first for cut: uses rounds.length to infer madeCut (4 rounds = made, 2 = missed).
 * Fallback to cutLineScore when API lacks sufficient data.
 */

import type { Tournament } from './types';
import type { GolferTournamentResult, RoundScore, GolferResultStatus } from './types';
import { pointsFromPosition } from './constants';
import { hasCut } from './tournament-utils';

/** Extract number from API value (handles $numberInt, plain number, string). */
function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'object' && v !== null && '$numberInt' in v) {
    const s = (v as { $numberInt?: string }).$numberInt;
    return typeof s === 'string' ? parseInt(s, 10) : 0;
  }
  if (typeof v === 'object' && v !== null && '$numberLong' in v) {
    const s = (v as { $numberLong?: string }).$numberLong;
    return typeof s === 'string' ? parseInt(s, 10) : 0;
  }
  const s = String(v).trim();
  if (s === 'E' || s === '') return 0;
  return parseInt(s, 10) || 0;
}

/** Parse scoreToPar: "-2" -> -2, "E" -> 0, "+2" -> 2. */
function parseToPar(s: unknown): number {
  if (s == null) return 0;
  const str = String(s).trim();
  if (str === 'E' || str === '') return 0;
  const num = parseInt(str, 10);
  if (!Number.isNaN(num)) return num;
  return 0;
}

/** Parse position: "1" -> 1, "T3" -> 3. */
function parsePosition(v: unknown): number | null {
  if (v == null) return null;
  const str = String(v).trim().replace(/^T/i, '');
  const n = parseInt(str, 10);
  return !Number.isNaN(n) && n > 0 ? n : null;
}

/** Normalize name for matching: lowercase, remove periods (J.J. -> JJ), collapse spaces. */
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface MapLeaderboardOptions {
  /** Tournament for cutLineScore when API doesn't provide cut info. */
  tournament: Tournament;
  /** Optional: golfer IDs from our field. Add stubs for missing (e.g. WD before start). */
  knownGolferIds?: string[];
  /**
   * Optional: field golfers (id + name). When present, resolve API rows by name to our field IDs.
   * Handles playerId mismatch between /tournament (field) and /leaderboard (results) APIs.
   */
  fieldGolfers?: Array<{ id: string; name: string }>;
}

/**
 * Map raw RapidAPI leaderboard response to GolferTournamentResult[].
 * Schema: leaderboardRows (or leaderboard/players), each row has:
 * - playerId, rounds: [{ scoreToPar, strokes, roundId }], total, position, status
 * - madeCut inferred from rounds.length: 4 = made, 2 = missed (when hasCut)
 */
export function mapLeaderboardToGolferResults(
  apiResponse: Record<string, unknown>,
  options: MapLeaderboardOptions
): GolferTournamentResult[] {
  const { tournament, knownGolferIds = [], fieldGolfers = [] } = options;
  const tournamentHasCut = hasCut(tournament);
  const cutLineScore = tournament.cutLineScore;

  const nameToFieldId = new Map<string, string>();
  for (const g of fieldGolfers) {
    const key = normalizeName(g.name);
    if (key) nameToFieldId.set(key, g.id);
  }

  const rows = (Array.isArray(apiResponse.leaderboardRows)
    ? apiResponse.leaderboardRows
    : Array.isArray(apiResponse.leaderboard)
      ? apiResponse.leaderboard
      : Array.isArray(apiResponse.players)
        ? apiResponse.players
        : []) as Array<Record<string, unknown>>;

  const results: GolferTournamentResult[] = [];
  const seenIds = new Set<string>();

  for (const row of rows) {
    const playerId = String(row.playerId ?? row.id ?? row.golferId ?? row.player_id ?? '').trim();
    if (!playerId) continue;

    const first = String(row.firstName ?? row.first_name ?? '').trim();
    const last = String(row.lastName ?? row.last_name ?? row.name ?? '').trim();
    const apiName = [first, last].filter(Boolean).join(' ');

    const golferId =
      fieldGolfers.length > 0 && apiName
        ? (nameToFieldId.get(normalizeName(apiName)) ?? playerId)
        : playerId;

    if (seenIds.has(golferId)) continue;
    seenIds.add(golferId);

    // Status: WD = withdrawn, cut = missed cut (API authoritative)
    const statusStr = String(row.status ?? '').toLowerCase();
    const isWd = statusStr === 'wd' || statusStr === 'withdrawn';
    const isCut = statusStr === 'cut';

    const apiRounds = (Array.isArray(row.rounds) ? row.rounds : []) as Array<Record<string, unknown>>;
    const rounds: RoundScore[] = apiRounds
      .sort((a, b) => toNum(a.roundId ?? a.round) - toNum(b.roundId ?? b.round))
      .map((r, i) => ({
        round: i + 1,
        score: toNum(r.strokes ?? r.score),
        toPar: parseToPar(r.scoreToPar ?? r.toPar ?? r.score),
      }))
      .filter((r) => r.score > 0 || r.toPar !== 0); // skip empty

    // Infer madeCut: API status takes precedence (cut, wd = missed)
    let madeCut: boolean;
    if (isWd || isCut) {
      madeCut = false;
    } else if (tournamentHasCut) {
      madeCut = rounds.length >= 4;
      // Fallback only when API has no status: use cutLineScore for 2-round golfers
      if (rounds.length === 2 && cutLineScore != null) {
        const twoRoundToPar = rounds.reduce((s, r) => s + r.toPar, 0);
        madeCut = twoRoundToPar <= cutLineScore;
      }
    } else {
      madeCut = true; // no-cut event
    }

    const totalToParFromRounds = rounds.reduce((s, r) => s + r.toPar, 0);
    const totalToPar =
      rounds.length > 0 ? totalToParFromRounds : parseToPar(row.total ?? row.totalToPar);
    const totalScore =
      rounds.length > 0
        ? rounds.reduce((s, r) => s + r.score, 0)
        : toNum(row.totalStrokesFromCompletedRounds ?? row.totalScore ?? row.totalStrokes);
    const finalPosition = madeCut ? parsePosition(row.position ?? row.rank) : null;

    const status: GolferResultStatus | undefined = isWd ? 'withdrawn' : undefined;

    // Compute points when results are final
    let basePoints = 0;
    let bonusPoints = 0;
    let totalPoints = 0;
    if (finalPosition != null && finalPosition > 0) {
      const pts = pointsFromPosition(finalPosition);
      basePoints = pts.basePoints;
      bonusPoints = pts.bonusPoints;
      totalPoints = pts.totalPoints;
    }

    results.push({
      golferId,
      finalPosition,
      rounds,
      totalScore: totalScore > 0 ? totalScore : rounds.reduce((s, r) => s + r.score, 0),
      totalToPar,
      madeCut,
      status,
      basePoints,
      bonusPoints,
      totalPoints,
    });
  }

  // Stubs for known golfers not in leaderboard (e.g. WD before start)
  for (const id of knownGolferIds) {
    if (seenIds.has(id)) continue;
    results.push({
      golferId: id,
      finalPosition: null,
      rounds: [],
      totalScore: 0,
      totalToPar: 0,
      madeCut: false,
      status: 'withdrawn',
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
    });
  }

  return results;
}
