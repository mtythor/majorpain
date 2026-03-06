'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getTournament,
  getTournaments,
  getGolfers,
  getTournamentData,
  getPlayers,
  updateDataCache,
} from '@/lib/data';
import { useTournamentData } from '@/lib/use-api-data';
import { fetchDraftState } from '@/lib/api-client';
import { calculateTeamScoresFromDrafts, isRyderCup } from '@/lib/dummyData';
import { GolferTypeahead } from '@/components/admin/GolferTypeahead';
import type {
  Tournament,
  TournamentState,
  TournamentResult,
  TeamDraft,
} from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getWriteSecret(): string {
  return (process.env.NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET || '').trim();
}

function getWriteSecretError(res: Response, json: { error?: string }, defaultMsg: string): string {
  if (res.status === 401 && !getWriteSecret()) {
    return 'Write secret not in build. Redeploy from GitHub Actions (set MAJOR_PAIN_WRITE_SECRET), or for manual deploy add NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET to server .env';
  }
  return json.error || defaultMsg;
}

const TOURNAMENT_STATES: TournamentState[] = ['pre-draft', 'draft', 'playing', 'completed'];

export default function AdminTournamentEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { loading } = useTournamentData(params.id);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [results, setResults] = useState<TournamentResult | null>(null);
  const [teamDraftsFromDraft, setTeamDraftsFromDraft] = useState<TeamDraft[] | null>(null);
  const [editableTeamDrafts, setEditableTeamDrafts] = useState<TeamDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveBtnHover, setSaveBtnHover] = useState(false);
  const [saveBtnActive, setSaveBtnActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writeSecretWarning, setWriteSecretWarning] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = getTournament(params.id) ?? getTournaments()[0];
    const { results: r } = getTournamentData(params.id);
    setTournament(t ?? null);
    setResults(r ?? null);
  }, [params.id, loading]);

  // Fetch completed draft from API when results don't have teamDrafts
  useEffect(() => {
    if (loading) return;
    if (results?.teamDrafts?.length) {
      setTeamDraftsFromDraft(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchDraftState(params.id);
        if (cancelled) return;
        if (res?.teamDrafts?.length) setTeamDraftsFromDraft(res.teamDrafts);
        else setTeamDraftsFromDraft(null);
      } catch {
        if (!cancelled) setTeamDraftsFromDraft(null);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id, loading, results?.teamDrafts?.length]);

  // Sync editable team drafts when source data changes
  useEffect(() => {
    const drafts = (results?.teamDrafts && results.teamDrafts.length > 0)
      ? results.teamDrafts
      : (teamDraftsFromDraft ?? []);
    setEditableTeamDrafts(drafts.map((d) => ({ ...d, activeGolfers: [...(d.activeGolfers ?? [])], alternateGolfer: d.alternateGolfer ?? '' })));
  }, [results?.teamDrafts, teamDraftsFromDraft]);

  // Clear "Saved!" feedback after 2 seconds
  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 2000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  // Check write secret: server requires it but client build doesn't have it
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/admin/write-secret-status`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { required?: boolean }) => {
        if (cancelled) return;
        if (data.required && !getWriteSecret()) {
          setWriteSecretWarning('Saves will fail: write secret not in build. Redeploy from GitHub Actions (set MAJOR_PAIN_WRITE_SECRET) or add NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET to server .env for manual deploy.');
        } else {
          setWriteSecretWarning(null);
        }
      })
      .catch(() => { if (!cancelled) setWriteSecretWarning(null); });
    return () => { cancelled = true; };
  }, []);

  const saveTournament = async (updated: Tournament) => {
    // Safeguard: moving to draft/pre-draft with results present → require erase first
    const backwardStates = ['draft', 'pre-draft'];
    const hasResultsWithRounds = results?.golferResults?.some((gr) => (gr.rounds?.length ?? 0) > 0);
    if (
      backwardStates.includes(updated.state ?? '') &&
      hasResultsWithRounds &&
      !confirm(
        'This tournament has results. Erase all results before moving to draft/pre-draft?'
      )
    ) {
      return;
    }
    if (backwardStates.includes(updated.state ?? '') && hasResultsWithRounds) {
      // User confirmed: erase results first, then save state
      setSaving(true);
      setError(null);
      try {
        const stateRes = await fetch(`${API_URL}/admin/state`, { cache: 'no-store' });
        const fullState = await stateRes.json();
        const resultsMap = { ...(fullState.results ?? {}) } as Record<string, TournamentResult>;
        const current = resultsMap[params.id] ?? { tournamentId: params.id, fatRandoStolenGolfers: [], teamDrafts: [], golferResults: [], teamScores: [] };
        const clearedResults: TournamentResult = { ...current, golferResults: [], teamScores: [] };
        resultsMap[params.id] = clearedResults;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const secret = getWriteSecret();
        if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

        const payload: Record<string, unknown> = { results: resultsMap };
        if (secret) payload.writeSecret = secret;
        const res = await fetch(`${API_URL}/admin/state`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to erase results'));
        updateDataCache(`results-${params.id}`, clearedResults);
        setResults(clearedResults);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to erase results');
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const stateRes = await fetch(`${API_URL}/admin/state`, { cache: 'no-store' });
      const fullState = await stateRes.json();
      const tournaments = (fullState.tournaments ?? []) as Tournament[];
      const idx = tournaments.findIndex((x) => x.id === params.id);
      const newTournaments = [...tournaments];
      if (idx >= 0) newTournaments[idx] = updated;
      else newTournaments.push(updated);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const payload: Record<string, unknown> = { tournaments: newTournaments };
      if (secret) payload.writeSecret = secret;
      const res = await fetch(`${API_URL}/admin/state`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to save'));
      updateDataCache('tournaments', newTournaments);
      setTournament(updated);
      setSaveSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveResults = async (updated: TournamentResult) => {
    setSaving(true);
    setError(null);
    try {
      const stateRes = await fetch(`${API_URL}/admin/state`, { cache: 'no-store' });
      const fullState = await stateRes.json();
      const resultsMap = { ...(fullState.results ?? {}) } as Record<string, TournamentResult>;
      resultsMap[params.id] = updated;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const payload: Record<string, unknown> = { results: resultsMap };
      if (secret) payload.writeSecret = secret;
      const res = await fetch(`${API_URL}/admin/state`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to save'));
      updateDataCache(`results-${params.id}`, updated);
      setResults(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveTeamDrafts = async (drafts: TeamDraft[]) => {
    setSaving(true);
    setError(null);
    try {
      const golferResults = results?.golferResults ?? [];
      const teamScores = golferResults.length > 0
        ? calculateTeamScoresFromDrafts(drafts, golferResults)
        : [];
      const updated: TournamentResult = {
        tournamentId: params.id,
        fatRandoStolenGolfers: results?.fatRandoStolenGolfers ?? [],
        teamDrafts: drafts,
        golferResults,
        teamScores,
      };
      const stateRes = await fetch(`${API_URL}/admin/state`, { cache: 'no-store' });
      const fullState = await stateRes.json();
      const resultsMap = { ...(fullState.results ?? {}) } as Record<string, TournamentResult>;
      resultsMap[params.id] = updated;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const payload: Record<string, unknown> = { results: resultsMap };
      if (secret) payload.writeSecret = secret;
      const res = await fetch(`${API_URL}/admin/state`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to save'));
      updateDataCache(`results-${params.id}`, updated);
      setResults(updated);
      setTeamDraftsFromDraft(null);
      setEditableTeamDrafts(drafts.map((d) => ({ ...d, activeGolfers: [...(d.activeGolfers ?? [])], alternateGolfer: d.alternateGolfer ?? '' })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedTournament = async (mode: 1 | 2 | 3 | 4 | 'golfers' | 'full') => {
    setSeeding(true);
    setSeedMessage(null);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const res = await fetch(`${API_URL}/admin/tournaments/${params.id}/seed`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to seed'));
      setSeedMessage(json.message || 'Tournament seeded successfully.');
      updateDataCache(`golfers-${params.id}`, undefined);
      updateDataCache(`results-${params.id}`, undefined);
      if (typeof window !== 'undefined') window.location.reload();
    } catch (e) {
      setSeedMessage(e instanceof Error ? e.message : 'Failed to seed');
    } finally {
      setSeeding(false);
    }
  };

  const updateDraftGolfer = (playerId: string, slot: 'active0' | 'active1' | 'active2' | 'alternate', golferId: string) => {
    setEditableTeamDrafts((prev) =>
      prev.map((d) => {
        if (d.playerId !== playerId) return d;
        if (slot === 'alternate') return { ...d, alternateGolfer: golferId };
        const idx = slot === 'active0' ? 0 : slot === 'active1' ? 1 : 2;
        const next = [...(d.activeGolfers ?? [])];
        while (next.length <= idx) next.push('');
        next[idx] = golferId;
        return { ...d, activeGolfers: next };
      })
    );
  };

  const handleResetScores = async () => {
    if (!confirm('Clear all golfer scores and team scores for this tournament? Draft data will be kept.')) return;
    setSaving(true);
    setError(null);
    try {
      const stateRes = await fetch(`${API_URL}/admin/state`, { cache: 'no-store' });
      const fullState = await stateRes.json();
      const resultsMap = { ...(fullState.results ?? {}) } as Record<string, TournamentResult>;
      const current = resultsMap[params.id] ?? { tournamentId: params.id, fatRandoStolenGolfers: [], teamDrafts: [], golferResults: [], teamScores: [] };
      const updated: TournamentResult = {
        ...current,
        golferResults: [],
        teamScores: [],
      };
      resultsMap[params.id] = updated;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const res = await fetch(`${API_URL}/admin/state`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ results: resultsMap }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to reset scores'));
      updateDataCache(`results-${params.id}`, updated);
      setResults(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset scores');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDrafts = async () => {
    if (!confirm('Clear all draft data (team picks, Fat Rando steals) for this tournament? Golfer scores will be kept. You can run a new draft and scores will apply to the new teams.')) return;
    setSaving(true);
    setError(null);
    try {
      const stateRes = await fetch(`${API_URL}/admin/state`, { cache: 'no-store' });
      const fullState = await stateRes.json();
      const resultsMap = { ...(fullState.results ?? {}) } as Record<string, TournamentResult>;
      const draftStates = { ...(fullState.draftStates ?? {}) } as Record<string, unknown>;
      delete draftStates[params.id];

      const current = resultsMap[params.id] ?? { tournamentId: params.id, fatRandoStolenGolfers: [], teamDrafts: [], golferResults: [], teamScores: [] };
      const updated: TournamentResult = {
        ...current,
        fatRandoStolenGolfers: [],
        teamDrafts: [],
        teamScores: [],
      };
      resultsMap[params.id] = updated;

      const tournaments = (fullState.tournaments ?? []) as Tournament[];
      const tournamentIdx = tournaments.findIndex((t) => t.id === params.id);
      const newTournaments = [...tournaments];
      if (tournamentIdx >= 0) {
        newTournaments[tournamentIdx] = { ...newTournaments[tournamentIdx], state: 'pre-draft' as TournamentState };
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const payload: Record<string, unknown> = { results: resultsMap, draftStates, tournaments: newTournaments };
      if (secret) payload.writeSecret = secret;
      const res = await fetch(`${API_URL}/admin/state`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to reset drafts'));
      updateDataCache(`results-${params.id}`, updated);
      updateDataCache('tournaments', newTournaments);
      setResults(updated);
      setTournament((prev) => (prev ? { ...prev, state: 'pre-draft' } : null));
      setTeamDraftsFromDraft(null);
      setEditableTeamDrafts([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset drafts');
    } finally {
      setSaving(false);
    }
  };

  if (!tournament) {
    return (
      <div style={{ color: '#fff', textAlign: 'center' }}>
        {loading ? 'Loading...' : 'Tournament not found'}
      </div>
    );
  }

  const golfers = getGolfers(params.id);
  const players = getPlayers();

  const updateT = (patch: Partial<Tournament>) =>
    setTournament((prev) => (prev ? { ...prev, ...patch } : null));
  const updateResults = (patch: Partial<TournamentResult>) =>
    setResults((prev) => (prev ? { ...prev, ...patch } : null));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#ffffff',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link
          href="/admin/tournaments"
          style={{ color: '#fdc71c', textDecoration: 'none', fontWeight: 700 }}
        >
          ← Tournaments
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{tournament.name}</h1>
      </div>
      {writeSecretWarning && (
        <div style={{ color: '#e12c55', marginBottom: '16px', padding: '12px', background: 'rgba(225,44,85,0.1)', borderRadius: '8px' }}>
          {writeSecretWarning}
        </div>
      )}
      {error && (
        <div style={{ color: '#e12c55', marginBottom: '16px' }}>{error}</div>
      )}

      {/* Tournament metadata */}
      <section
        style={{
          width: '100%',
          padding: '20px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 800 }}>
          Metadata
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '120px' }}>State</label>
            <select
              value={tournament.state ?? 'pre-draft'}
              onChange={(e) =>
                updateT({ state: e.target.value as TournamentState })
              }
              style={{
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
              }}
            >
              {TOURNAMENT_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '120px' }}>Draft Start</label>
            <input
              type="date"
              value={tournament.draftStartDate?.slice(0, 10) ?? ''}
              onChange={(e) => updateT({ draftStartDate: e.target.value || undefined })}
              style={{
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '120px' }}>Start Date</label>
            <input
              type="date"
              value={tournament.startDate?.slice(0, 10) ?? ''}
              onChange={(e) => updateT({ startDate: e.target.value || undefined })}
              style={{
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '120px' }}>End Date</label>
            <input
              type="date"
              value={tournament.endDate?.slice(0, 10) ?? ''}
              onChange={(e) => updateT({ endDate: e.target.value || undefined })}
              style={{
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '120px' }}>Cut Line Score</label>
            <input
              type="number"
              value={tournament.cutLineScore ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                updateT({ cutLineScore: v === '' ? undefined : parseInt(v, 10) });
              }}
              placeholder="e.g. 4 (+4 or better makes cut)"
              style={{
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                width: '80px',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '120px' }}>Background Image</label>
            <input
              type="text"
              value={tournament.backgroundImage ?? ''}
              onChange={(e) => updateT({ backgroundImage: e.target.value })}
              placeholder="/images/course-name.jpg"
              style={{
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                flex: 1,
              }}
            />
          </div>
          <button
            onClick={() => saveTournament(tournament)}
            disabled={saving}
            onMouseEnter={() => setSaveBtnHover(true)}
            onMouseLeave={() => { setSaveBtnHover(false); setSaveBtnActive(false); }}
            onMouseDown={() => setSaveBtnActive(true)}
            onMouseUp={() => setSaveBtnActive(false)}
            style={{
              padding: '10px 20px',
              backgroundColor: saveSuccess
                ? '#5a8f3e'
                : saving
                  ? '#555'
                  : saveBtnActive
                    ? '#5a8f3e'
                    : saveBtnHover
                      ? '#8bc96f'
                      : '#74a553',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              alignSelf: 'flex-start',
              transform: saveBtnActive ? 'scale(0.98)' : 'scale(1)',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
          >
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Metadata'}
          </button>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #444' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', opacity: 0.9 }}>Seed Test Data</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {isRyderCup(params.id) ? (
                <button
                  onClick={() => handleSeedTournament('full')}
                  disabled={seeding}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: seeding ? '#555' : '#74a553',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: seeding ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '11px',
                  }}
                >
                  {seeding ? 'Seeding...' : 'Seed full'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleSeedTournament('golfers')}
                    disabled={seeding}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: seeding ? '#555' : '#fdc71c',
                      color: '#000',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: seeding ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    {seeding ? '...' : 'Field'}
                  </button>
                  {([1, 2, 3, 4] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSeedTournament(r)}
                      disabled={seeding}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: seeding ? '#555' : '#3ca1ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: seeding ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '11px',
                      }}
                    >
                      {seeding ? '...' : `R${r}`}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSeedTournament('full')}
                    disabled={seeding}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: seeding ? '#555' : '#74a553',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: seeding ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    {seeding ? '...' : 'Full'}
                  </button>
                </>
              )}
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
              Field: golfers only (for draft). R1–R4: add scores through that round (uses your draft picks). Full: golfers + all rounds (fills gaps).
            </div>
            {seedMessage && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: seedMessage.includes('Failed') ? '#e12c55' : '#74a553' }}>
                {seedMessage}
              </div>
            )}
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #444' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', opacity: 0.9 }}>Reset (Testing)</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleResetScores}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: saving ? '#555' : '#e12c55',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                Reset Scores
              </button>
              <button
                onClick={handleResetDrafts}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: saving ? '#555' : '#e12c55',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                Reset Drafts
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
              Reset Scores: clears golfer results and team scores; keeps draft picks. Reset Drafts: clears team picks and Fat Rando steals; keeps golfer scores. You can draft after scores exist—the system will apply scores to new teams.
            </div>
          </div>
        </div>
      </section>

      {/* Draft complete indicator - when teamDrafts exist but state is still draft */}
      {((results?.teamDrafts?.length ?? 0) > 0 || (teamDraftsFromDraft?.length ?? 0) > 0) &&
        tournament.state === 'draft' && (
        <section
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'rgba(116, 165, 83, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #74a553',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}>Draft complete.</span>
              <span style={{ opacity: 0.9 }}>Update tournament state to Playing?</span>
              <button
                onClick={() => {
                  updateT({ state: 'playing' });
                  saveTournament({ ...tournament, state: 'playing' });
                }}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#74a553',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                }}
              >
                Update to Playing
              </button>
            </div>
            {(!results?.teamDrafts?.length && (teamDraftsFromDraft?.length ?? 0) > 0) && (
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                Draft data is in localStorage. Save to database so it persists across devices?
                <button
                  onClick={async () => {
                    const drafts = teamDraftsFromDraft ?? [];
                    const fatRando = (typeof window !== 'undefined' && (() => {
                      try {
                        const s = localStorage.getItem(`completed-draft-${params.id}`);
                        if (s) return JSON.parse(s).fatRandoStolenGolfers ?? [];
                      } catch { }
                      return [];
                    })()) as string[];
                    setSaving(true);
                    setError(null);
                    try {
                      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                      const secret = getWriteSecret();
                      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;
                      const res = await fetch(`${API_URL}/tournaments/${params.id}/draft`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ teamDrafts: drafts, fatRandoStolenGolfers: fatRando }),
                      });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to save'));
                      updateDataCache(`results-${params.id}`, {
                        tournamentId: params.id,
                        teamDrafts: drafts,
                        fatRandoStolenGolfers: fatRando,
                        golferResults: results?.golferResults ?? [],
                        teamScores: results?.teamScores ?? [],
                      });
                      setResults((prev) => prev ? { ...prev, teamDrafts: drafts, fatRandoStolenGolfers: fatRando } : null);
                      setTeamDraftsFromDraft(null);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to save');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  style={{
                    marginLeft: '12px',
                    padding: '6px 12px',
                    backgroundColor: '#3ca1ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  Save to Database
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Team drafts - editable, use dropdowns to replace golfers */}
      <section
        style={{
          width: '100%',
          padding: '20px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 800 }}>
          Team Drafts
        </h2>
        {editableTeamDrafts.length === 0 ? (
          <div style={{ opacity: 0.8 }}>
            No draft data yet. Complete a draft to see player teams here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {editableTeamDrafts.map((draft) => {
              const player = players.find((p) => p.id === draft.playerId);
              const actives = draft.activeGolfers ?? [];
              const draftedByOthers = editableTeamDrafts
                .filter((d) => d.playerId !== draft.playerId)
                .flatMap((d) => [...(d.activeGolfers ?? []), d.alternateGolfer].filter(Boolean));
              const fatRandoStolen = results?.fatRandoStolenGolfers ?? [];
              const allDraftedExcludingCurrent = [...draftedByOthers, ...fatRandoStolen];
              return (
                <div
                  key={draft.playerId}
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '12px' }}>
                    {player?.name ?? draft.playerId}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, width: '70px' }}>Active 1:</span>
                      <GolferTypeahead
                        golfers={golfers}
                        value={actives[0] ?? ''}
                        onChange={(id) => updateDraftGolfer(draft.playerId, 'active0', id)}
                        excludeIds={[...[actives[1], actives[2], draft.alternateGolfer].filter(Boolean), ...allDraftedExcludingCurrent]}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, width: '70px' }}>Active 2:</span>
                      <GolferTypeahead
                        golfers={golfers}
                        value={actives[1] ?? ''}
                        onChange={(id) => updateDraftGolfer(draft.playerId, 'active1', id)}
                        excludeIds={[...[actives[0], actives[2], draft.alternateGolfer].filter(Boolean), ...allDraftedExcludingCurrent]}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, width: '70px' }}>Active 3:</span>
                      <GolferTypeahead
                        golfers={golfers}
                        value={actives[2] ?? ''}
                        onChange={(id) => updateDraftGolfer(draft.playerId, 'active2', id)}
                        excludeIds={[...[actives[0], actives[1], draft.alternateGolfer].filter(Boolean), ...allDraftedExcludingCurrent]}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, width: '70px' }}>Alternate:</span>
                      <GolferTypeahead
                        golfers={golfers}
                        value={draft.alternateGolfer ?? ''}
                        onChange={(id) => updateDraftGolfer(draft.playerId, 'alternate', id)}
                        excludeIds={[...actives.filter(Boolean), ...allDraftedExcludingCurrent]}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => saveTeamDrafts(editableTeamDrafts)}
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: '#74a553',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                alignSelf: 'flex-start',
              }}
            >
              Save Team Drafts
            </button>
          </div>
        )}
      </section>

      {/* Golfer results */}
      {results?.golferResults && results.golferResults.length > 0 && (
        <section
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 800 }}>
            Golfer Results
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {results.golferResults.map((gr) => {
              const golfer = golfers.find((g) => g.id === gr.golferId);
              return (
                <div
                  key={gr.golferId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ width: '140px' }}>{golfer?.name ?? gr.golferId}</span>
                  <span>Pos: {gr.finalPosition ?? 'MC'}</span>
                  <span>Cut: {gr.madeCut ? 'Y' : 'N'}</span>
                  <select
                    value={gr.status ?? 'active'}
                    onChange={(e) => {
                      const status = e.target.value as 'active' | 'cut' | 'withdrawn';
                      const updated = results!.golferResults.map((r) =>
                        r.golferId === gr.golferId
                          ? { ...r, status, madeCut: status === 'withdrawn' ? false : r.madeCut }
                          : r
                      );
                      updateResults({ golferResults: updated });
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#333',
                      color: '#fff',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <option value="active">active</option>
                    <option value="cut">cut</option>
                    <option value="withdrawn">withdrawn</option>
                  </select>
                  <span>Pts: {gr.totalPoints}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => results && saveResults(results)}
            disabled={saving}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              backgroundColor: '#74a553',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            Save Golfer Results
          </button>
        </section>
      )}

      {!results?.golferResults?.length && (
        <div style={{ opacity: 0.7, marginBottom: '16px' }}>
          No golfer results yet. Add round scores to see golfer results here.
        </div>
      )}
    </div>
  );
}
