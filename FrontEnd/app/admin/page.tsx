'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTournaments, getPlayers, updateDataCache } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import type { Tournament, TournamentState, Player } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const TOKEN_KEY = 'major_pain_token';

const stateColors: Record<TournamentState, string> = {
  'pre-draft': '#888',
  draft: '#fdc71c',
  playing: '#3ca1ff',
  completed: '#74a553',
};

interface UserRow {
  playerId: number;
  username: string;
  playerName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

function getWriteSecret(): string {
  return (process.env.NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET || '').trim();
}

function getWriteSecretError(res: Response, json: { error?: string }, defaultMsg: string): string {
  if (res.status === 401 && !getWriteSecret()) {
    return 'Write secret not in build. Redeploy from GitHub Actions (set MAJOR_PAIN_WRITE_SECRET), or for manual deploy add NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET to server .env';
  }
  return json.error || defaultMsg;
}

export default function AdminPage() {
  const { currentUser } = useAuth();
  const tournaments = getTournaments();
  const [players, setPlayers] = useState<Player[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editForceChange, setEditForceChange] = useState(false);
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writeSecretWarning, setWriteSecretWarning] = useState<string | null>(null);

  useEffect(() => {
    setPlayers(getPlayers());
  }, []);

  useEffect(() => {
    if (!currentUser?.isSuperAdmin) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) return;
    fetch(`${API_URL}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [currentUser?.isSuperAdmin]);

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

  const handleSaveProfile = async (updated: Player[]) => {
    setSaving(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const payload: Record<string, unknown> = { players: updated };
      if (secret) payload.writeSecret = secret;
      const res = await fetch(`${API_URL}/admin/state`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getWriteSecretError(res, json, 'Failed to save'));
      updateDataCache('players', updated);
      setPlayers(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUser = async (playerId: string) => {
    const pid = parseInt(playerId, 10);
    if (isNaN(pid) || pid < 1 || pid > 4) return;
    if (currentUser?.playerId === pid && editIsAdmin === false) {
      setError('Super-admin cannot revoke own admin');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error('Not authenticated');

      const body: { is_admin?: boolean; password?: string; forcePasswordChange?: boolean } = {
        is_admin: editIsAdmin,
        forcePasswordChange: editForceChange,
      };
      if (editPassword) body.password = editPassword;

      const res = await fetch(`${API_URL}/auth/users/${pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setUsers((prev) =>
        prev.map((u) => (u.playerId === pid ? { ...u, isAdmin: editIsAdmin } : u))
      );
      setEditPassword('');
      setEditForceChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (updated: Player[], editingId: string) => {
    await handleSaveProfile(updated);
    if (currentUser?.isSuperAdmin && ['1', '2', '3', '4'].includes(editingId)) {
      await handleSaveUser(editingId);
    }
    setEditing(null);
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const openEdit = (p: Player) => {
    setEditing(p.id);
    setEditPassword('');
    setEditForceChange(false);
    const u = users.find((x) => String(x.playerId) === p.id);
    setEditIsAdmin(u?.isAdmin ?? false);
    setError(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#ffffff',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 800 }}>
        Admin
      </h1>

      {/* Tournaments */}
      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, marginBottom: '16px', alignSelf: 'flex-start' }}>
        Tournaments
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '32px' }}>
        {tournaments.map((t: Tournament) => (
          <Link
            key={t.id}
            href={`/admin/tournaments/${t.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 24px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '8px',
              color: '#ffffff',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: '100px',
                fontSize: '12px',
                fontWeight: 800,
                color: stateColors[t.state ?? 'pre-draft'] ?? '#888',
              }}
            >
              {t.state ?? 'pre-draft'}
            </span>
            <span style={{ flex: 1, fontWeight: 600 }}>{t.name}</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {t.draftStartDate ?? '-'} → {t.startDate ?? '-'}
            </span>
          </Link>
        ))}
      </div>

      {/* Players */}
      <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 800, alignSelf: 'flex-start' }}>
        Players
      </h2>
      {writeSecretWarning && (
        <div style={{ color: '#e12c55', marginBottom: '16px', alignSelf: 'flex-start', padding: '12px', background: 'rgba(225,44,85,0.1)', borderRadius: '8px' }}>
          {writeSecretWarning}
        </div>
      )}
      {error && (
        <div style={{ color: '#e12c55', marginBottom: '16px', alignSelf: 'flex-start' }}>{error}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {players.map((p) => {
          const user = users.find((u) => String(u.playerId) === p.id);
          const showUserFields = currentUser?.isSuperAdmin && user && ['1', '2', '3', '4'].includes(p.id);
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: '8px',
              }}
            >
              {editing === p.id ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <input
                      value={p.name}
                      onChange={(e) => updatePlayer(p.id, 'name', e.target.value)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        flex: 1,
                        minWidth: '120px',
                      }}
                    />
                    <input
                      value={p.imageUrl}
                      onChange={(e) => updatePlayer(p.id, 'imageUrl', e.target.value)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        flex: 1,
                        minWidth: '120px',
                      }}
                      placeholder="imageUrl"
                    />
                  </div>
                  {showUserFields && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #333',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        Login: {user?.username}
                        {user?.isSuperAdmin && ' (Super-admin)'}
                      </span>
                      {user?.isSuperAdmin && currentUser?.playerId === parseInt(p.id, 10) ? (
                        <div style={{ color: '#888', fontSize: '14px' }}>Super-admin (cannot revoke admin)</div>
                      ) : (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={editIsAdmin}
                            onChange={(e) => setEditIsAdmin(e.target.checked)}
                          />
                          Admin
                        </label>
                      )}
                      <input
                        type="password"
                        placeholder="Set new password (optional)"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        style={{
                          padding: '8px',
                          backgroundColor: '#141414',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '4px',
                          maxWidth: '200px',
                        }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={editForceChange}
                          onChange={(e) => setEditForceChange(e.target.checked)}
                        />
                        Force change on next login
                      </label>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSave(players, p.id)}
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
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#666',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                  {user && (
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      ({user.username}
                      {user.isAdmin && ' • Admin'}
                      {user.isSuperAdmin && ' • Super-admin'}
                      )
                    </span>
                  )}
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>{p.imageUrl}</span>
                  <button
                    onClick={() => openEdit(p)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3ca1ff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
