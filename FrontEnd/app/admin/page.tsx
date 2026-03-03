'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTournaments, getPlayers, updateDataCache } from '@/lib/data';
import type { Tournament, TournamentState, Player } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const stateColors: Record<TournamentState, string> = {
  'pre-draft': '#888',
  draft: '#fdc71c',
  playing: '#3ca1ff',
  completed: '#74a553',
};

function getWriteSecret(): string {
  return (process.env.NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET || '').trim();
}

export default function AdminPage() {
  const tournaments = getTournaments();
  const [players, setPlayers] = useState<Player[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlayers(getPlayers());
  }, []);

  const handleSave = async (updated: Player[]) => {
    setSaving(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const secret = getWriteSecret();
      if (secret) headers['X-Major-Pain-Write-Secret'] = secret;

      const res = await fetch(`${API_URL}/admin/state`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ players: updated }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      updateDataCache('players', updated);
      setPlayers(updated);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
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
      {error && (
        <div style={{ color: '#e12c55', marginBottom: '16px', alignSelf: 'flex-start' }}>{error}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '8px',
            }}
          >
            {editing === p.id ? (
              <>
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
                  }}
                  placeholder="imageUrl"
                />
                <button
                  onClick={() => handleSave(players)}
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
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>{p.imageUrl}</span>
                <button
                  onClick={() => setEditing(p.id)}
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
