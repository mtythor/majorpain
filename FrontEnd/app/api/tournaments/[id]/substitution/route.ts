import { NextRequest, NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/api-db';
import { verifyToken } from '@/lib/auth';
import { calculateTeamScoresFromDrafts } from '@/lib/dummyData';
import { mergeTournamentsWithSchedule } from '@/lib/tournamentSchedule';
import type { TournamentResult, TeamDraft } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function isAfterRound2(results: TournamentResult): boolean {
  return results.golferResults.some((gr) => (gr.rounds?.length ?? 0) >= 2);
}

function isSubWindowOpen(startDate: string | undefined): boolean {
  if (!startDate) return false;
  const cutoff = new Date(startDate + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() + 2);
  cutoff.setHours(14, 0, 0, 0); // 2pm UTC = 8am MDT Saturday — gives players overnight after R2
  return new Date() < cutoff;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth: require valid JWT
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { playerId?: string; replacedGolferId?: string; replacementGolferId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { playerId, replacedGolferId, replacementGolferId } = body;
  if (!playerId || !replacedGolferId || !replacementGolferId) {
    return NextResponse.json({ error: 'playerId, replacedGolferId, replacementGolferId required' }, { status: 400 });
  }

  // Player can only sub for themselves (admin can sub for anyone)
  if (!user.isAdmin && String(user.playerId) !== playerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data } = await getData();
  if (!data) return NextResponse.json({ error: 'No data' }, { status: 500 });

  const tournamentId = params.id;
  const results = (data.results as Record<string, TournamentResult> | undefined)?.[tournamentId];

  if (!results) {
    return NextResponse.json({ error: 'Tournament results not found' }, { status: 404 });
  }

  // Validate substitution window — use merged schedule so startDate is always populated
  const tournaments = mergeTournamentsWithSchedule(data.tournaments as Array<{ id: string; state?: string }> ?? []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!isSubWindowOpen(tournament?.startDate)) {
    return NextResponse.json({ error: 'Substitution window is closed' }, { status: 422 });
  }

  if (!isAfterRound2(results)) {
    return NextResponse.json({ error: 'Substitutions not available until after round 2' }, { status: 422 });
  }

  const draft = results.teamDrafts.find((d: TeamDraft) => d.playerId === playerId);
  if (!draft) {
    return NextResponse.json({ error: 'Team draft not found' }, { status: 404 });
  }

  // Non-admin: cannot make a second voluntary sub
  if (!user.isAdmin && draft.substitutions?.length) {
    return NextResponse.json({ error: 'Substitution already made' }, { status: 422 });
  }

  // Validate replacedGolferId is an active golfer
  if (!draft.activeGolfers.includes(replacedGolferId)) {
    return NextResponse.json({ error: 'replacedGolferId must be an active golfer on this team' }, { status: 422 });
  }

  // Validate replacementGolferId is the alternate
  if (draft.alternateGolfer !== replacementGolferId) {
    return NextResponse.json({ error: 'replacementGolferId must be the team alternate' }, { status: 422 });
  }

  // For non-admin: validate all eligibility conditions
  if (!user.isAdmin) {
    const allActivesMadeCut = draft.activeGolfers.every((golferId: string) => {
      const gr = results.golferResults.find((r) => r.golferId === golferId);
      return gr?.madeCut === true;
    });
    if (!allActivesMadeCut) {
      return NextResponse.json({ error: 'Voluntary substitution requires all active golfers to have made the cut' }, { status: 422 });
    }
    const alternateResult = results.golferResults.find((r) => r.golferId === draft.alternateGolfer);
    if (!alternateResult?.madeCut) {
      return NextResponse.json({ error: 'Alternate must have made the cut' }, { status: 422 });
    }
  }

  // Apply substitution
  const updatedDrafts = results.teamDrafts.map((d: TeamDraft) => {
    if (d.playerId !== playerId) return d;
    return {
      ...d,
      substitutions: [
        ...(d.substitutions ?? []),
        { round: 2, replacedGolferId, replacementGolferId },
      ],
    };
  });

  const updatedResults: TournamentResult = {
    ...results,
    teamDrafts: updatedDrafts,
    teamScores: calculateTeamScoresFromDrafts(updatedDrafts, results.golferResults),
  };

  const newData = {
    ...data,
    results: {
      ...(data.results as object),
      [tournamentId]: updatedResults,
    },
  };

  await saveData(newData);

  return NextResponse.json({ ok: true });
}
