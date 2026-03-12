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
import { getTournamentState } from '@/lib/tournament-utils';
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
  if (res.status === 401) {
    if (!getWriteSecret()) {
      return 'Write secret not in build. Redeploy from GitHub Actions (set MAJOR_PAIN_WRITE_SECRET), or for manual deploy add NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET to server .env';
    }
    return 'Unauthorized: write secret does not match. Ensure MAJOR_PAIN_WRITE_SECRET in GitHub Actions exactly matches server .env (no extra spaces/newlines).';
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
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [syncResultsRefreshing, setSyncResultsRefreshing] = useState(false);
  const [syncResultsMessage, setSyncResultsMessage] = useState<string | null>(null);
  const [randoInitiating, setRandoInitiating] = useState(false);
  const [randoMessage, setRandoMessage] = useState<string | null>(null);
  const [addingSubForPlayer, setAddingSubForPlayer] = useState<string | null>(null);
  const [pendingSubReplacedId, setPendingSubReplacedId] = useState<string>('');
  const [draftSaveSuccess, setDraftSaveSuccess] = useState(false);
  const [draftSaveBtnHover, setDraftSaveBtnHover] = useState(false);
  const [draftSaveBtnActive, setDraftSaveBtnActive] = useState(false);

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

  useEffect(() => {
    if (!draftSaveSuccess) return;
    const t = setTimeout(() => setDraftSaveSuccess(false), 2000);
    return () => clearTimeout(t);
  }, [draftSaveSuccess]);

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
      setDraftSaveSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleImportFromLive = async () => {
    setImporting(true);
    setImportMessage(null);
    setSyncResultsMessage(null);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const res = await fetch(`${API_URL}/admin/tournaments/${params.id}/import-field`, {
        method: 'POST',
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = json?.error || getWriteSecretError(res, json, 'Failed to import');
        throw new Error(errMsg);
      }
      setImportMessage(json.message || 'Imported golfers from live API.');
      updateDataCache(`golfers-${params.id}`, undefined);
      updateDataCache(`results-${params.id}`, undefined);
      // Clear localStorage draft keys so no stale steals persist
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`draft-${params.id}`);
        localStorage.removeItem(`completed-draft-${params.id}`);
      }
      // Delay reload so user sees success message
      if (typeof window !== 'undefined') {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to import from live API';
      setImportMessage(msg);
    } finally {
      setImporting(false);
    }
  };

  const handleRefreshResults = async () => {
    if (!tournament) return;
    setSyncResultsRefreshing(true);
    setSyncResultsMessage(null);
    setImportMessage(null);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const res = await fetch(`${API_URL}/admin/tournaments/${params.id}/sync-results`, {
        method: 'POST',
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = json?.error || getWriteSecretError(res, json, 'Failed to sync results');
        throw new Error(errMsg);
      }
      setSyncResultsMessage(json.message || 'Results refreshed from Live API.');
      updateDataCache(`results-${params.id}`, undefined);
      if (typeof window !== 'undefined') {
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to sync results';
      setSyncResultsMessage(msg);
    } finally {
      setSyncResultsRefreshing(false);
    }
  };

  const handleInitiateRandoSteals = async () => {
    setRandoInitiating(true);
    setRandoMessage(null);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const res = await fetch(`${API_URL}/admin/tournaments/${params.id}/initiate-rando-steals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = json?.error || getWriteSecretError(res, json, 'Failed to initiate steals');
        throw new Error(errMsg);
      }
      setRandoMessage(json.message || 'Fat Rando steals initiated.');
      if (typeof window !== 'undefined') {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to initiate Fat Rando steals';
      setRandoMessage(msg);
    } finally {
      setRandoInitiating(false);
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
            <label style={{ width: '120px' }}>Manual Testing Mode</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!tournament.manualTestingMode}
                onChange={(e) => updateT({ manualTestingMode: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px' }}>
                Show player selector on draft page (for testing picks as any player)
              </span>
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '120px' }}>Field Source</label>
            <select
              value={tournament.fieldSource ?? 'dummy'}
              onChange={(e) => updateT({ fieldSource: e.target.value as 'dummy' | 'live' })}
              style={{
                padding: '8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
              }}
            >
              <option value="dummy">Dummy (testing)</option>
              <option value="live">Live API</option>
            </select>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {tournament.fieldSource === 'live' ? 'Use real field from RapidAPI' : 'Use seeded dummy golfers'}
            </span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            {tournament.fieldSource === 'live' && (
              <div style={{ fontSize: '11px', opacity: 0.8, marginLeft: '132px' }}>
                Fallback only when Live API has no cut info; auto-sync uses API cut when available.
              </div>
            )}
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
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', opacity: 0.9 }}>Current Field</div>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.9 }}>
              <div>
                <strong>Golfers:</strong> {getGolfers(params.id).length}
              </div>
              {tournament.fieldMeta ? (
                <>
                  <div>
                    <strong>Source:</strong> {tournament.fieldMeta.source === 'live' ? 'Live API (RapidAPI)' : 'Dummy (test data)'}
                  </div>
                  <div>
                    <strong>Loaded:</strong> {new Date(tournament.fieldMeta.at).toLocaleString()} ({tournament.fieldMeta.count} golfers)
                  </div>
                  {tournament.fieldMeta.source === 'live' && tournament.fieldMeta.liveApiTournId && (
                    <div style={{ fontSize: '11px', color: '#74a553' }}>
                      Verified from RapidAPI: tournId={tournament.fieldMeta.liveApiTournId}, year={tournament.fieldMeta.liveApiYear ?? '—'}
                    </div>
                  )}
                </>
              ) : getGolfers(params.id).length > 0 ? (
                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                  Source unknown (loaded before provenance tracking, or via auto-fetch when field was empty).
                </div>
              ) : (
                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                  No field loaded yet. Seed or import to populate.
                </div>
              )}
            </div>
          </div>
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
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', opacity: 0.9 }}>Import Live Data</div>
            {tournament.fieldSource === 'live' && getTournamentState(tournament) === 'draft' && (
              <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(253, 199, 28, 0.2)', borderRadius: '4px', fontSize: '12px', color: '#fdc71c' }}>
                Draft has started. Import will reset the draft. Only use before draft starts.
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleImportFromLive}
                disabled={importing || seeding || tournament.fieldSource !== 'live'}
                style={{
                  padding: '6px 12px',
                  backgroundColor: importing || seeding || tournament.fieldSource !== 'live' ? '#555' : '#3ca1ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: importing || seeding || tournament.fieldSource !== 'live' ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              >
                {importing ? 'Importing...' : 'Import from Live API'}
              </button>
              <button
                onClick={handleRefreshResults}
                disabled={syncResultsRefreshing || importing || seeding || tournament.fieldSource !== 'live' || getTournamentState(tournament) === 'draft'}
                style={{
                  padding: '6px 12px',
                  backgroundColor: syncResultsRefreshing || importing || seeding || tournament.fieldSource !== 'live' || getTournamentState(tournament) === 'draft' ? '#555' : '#5a8f3e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: syncResultsRefreshing || importing || seeding || tournament.fieldSource !== 'live' || getTournamentState(tournament) === 'draft' ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              >
                {syncResultsRefreshing ? 'Refreshing...' : 'Refresh results from Live API'}
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
              {tournament.fieldSource === 'live'
                ? 'Import: fetch the real tournament field from RapidAPI. Refresh: sync golfer scores during playing/completed. Requires RAPIDAPI_KEY.'
                : 'Set Field Source to Live API above and save to enable.'}
            </div>
            {(importMessage || syncResultsMessage) && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: (importMessage || syncResultsMessage)?.includes('Failed') || (importMessage || syncResultsMessage)?.includes('error') ? '#e12c55' : '#74a553' }}>
                {importMessage || syncResultsMessage}
              </div>
            )}
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #444' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', opacity: 0.9 }}>Initiate Fat Rando Steals</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleInitiateRandoSteals}
                disabled={randoInitiating || getGolfers(params.id).length < 20 || isRyderCup(params.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: randoInitiating || getGolfers(params.id).length < 20 || isRyderCup(params.id) ? '#555' : '#fdc71c',
                  color: randoInitiating || getGolfers(params.id).length < 20 || isRyderCup(params.id) ? '#999' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: randoInitiating || getGolfers(params.id).length < 20 || isRyderCup(params.id) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              >
                {randoInitiating ? 'Initiating...' : 'Initiate Fat Rando Steals'}
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
              {isRyderCup(params.id)
                ? 'Not available for Ryder Cup / Presidents Cup.'
                : getGolfers(params.id).length < 20
                  ? `Need at least 20 golfers in the field (currently ${getGolfers(params.id).length}). Seed or import the field first.`
                  : 'Generate Fat Rando steals and initialize draft state. Run after seeding or importing the field.'}
            </div>
            {randoMessage && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: randoMessage.includes('Failed') || randoMessage.includes('error') ? '#e12c55' : '#74a553' }}>
                {randoMessage}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, width: '70px' }}>Sub:</span>
                      {draft.substitutions?.length ? (
                        <>
                          <span style={{ fontSize: '13px' }}>
                            {golfers.find((g) => g.id === draft.substitutions![0].replacedGolferId)?.name ?? draft.substitutions![0].replacedGolferId}
                            {' → '}
                            {golfers.find((g) => g.id === draft.substitutions![0].replacementGolferId)?.name ?? draft.substitutions![0].replacementGolferId}
                          </span>
                          <button
                            onClick={() => setEditableTeamDrafts((prev) => prev.map((d) => d.playerId !== draft.playerId ? d : { ...d, substitutions: [] }))}
                            style={{ padding: '3px 8px', backgroundColor: '#ae6161', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Remove
                          </button>
                        </>
                      ) : addingSubForPlayer === draft.playerId ? (
                        <>
                          <select
                            value={pendingSubReplacedId}
                            onChange={(e) => setPendingSubReplacedId(e.target.value)}
                            style={{ padding: '4px 8px', backgroundColor: '#222', color: '#fff', border: '1px solid #555', borderRadius: '3px', fontSize: '13px' }}
                          >
                            {(draft.activeGolfers ?? []).map((id) => {
                              const g = golfers.find((g) => g.id === id);
                              return <option key={id} value={id}>{g?.name ?? id}</option>;
                            })}
                          </select>
                          <span style={{ fontSize: '12px', color: '#aaa' }}>→ {golfers.find((g) => g.id === draft.alternateGolfer)?.name ?? draft.alternateGolfer}</span>
                          <button
                            onClick={() => {
                              if (!pendingSubReplacedId || !draft.alternateGolfer) return;
                              setEditableTeamDrafts((prev) => prev.map((d) => d.playerId !== draft.playerId ? d : { ...d, substitutions: [{ round: 2, replacedGolferId: pendingSubReplacedId, replacementGolferId: draft.alternateGolfer }] }));
                              setAddingSubForPlayer(null);
                              setPendingSubReplacedId('');
                            }}
                            style={{ padding: '3px 8px', backgroundColor: '#74a553', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setAddingSubForPlayer(null); setPendingSubReplacedId(''); }}
                            style={{ padding: '3px 8px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setAddingSubForPlayer(draft.playerId); setPendingSubReplacedId(draft.activeGolfers[0] ?? ''); }}
                          disabled={!draft.alternateGolfer || !draft.activeGolfers?.length}
                          style={{ padding: '3px 8px', backgroundColor: '#3ca1ff', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Add Sub
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => saveTeamDrafts(editableTeamDrafts)}
              disabled={saving}
              onMouseEnter={() => setDraftSaveBtnHover(true)}
              onMouseLeave={() => { setDraftSaveBtnHover(false); setDraftSaveBtnActive(false); }}
              onMouseDown={() => setDraftSaveBtnActive(true)}
              onMouseUp={() => setDraftSaveBtnActive(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: draftSaveSuccess
                  ? '#5a8f3e'
                  : saving
                    ? '#555'
                    : draftSaveBtnActive
                      ? '#5a8f3e'
                      : draftSaveBtnHover
                        ? '#8bc96f'
                        : '#74a553',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                alignSelf: 'flex-start',
                transform: draftSaveBtnActive ? 'scale(0.98)' : 'scale(1)',
                transition: 'background-color 0.15s ease, transform 0.1s ease',
              }}
            >
              {saving ? 'Saving...' : draftSaveSuccess ? 'Saved!' : 'Save Team Drafts'}
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
                  <span>Pos: {gr.status === 'withdrawn' ? 'WD' : gr.finalPosition ?? (gr.madeCut !== true ? 'CUT' : '--')}</span>
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
