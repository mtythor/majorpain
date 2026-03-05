/**
 * In-memory event bus for draft updates.
 * When draft-state POST succeeds, we emit so SSE clients get real-time updates.
 */

type DraftUpdateListener = (tournamentId: string) => void;

const listeners = new Set<DraftUpdateListener>();

export function onDraftUpdate(cb: DraftUpdateListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitDraftUpdate(tournamentId: string): void {
  listeners.forEach((cb) => {
    try {
      cb(tournamentId);
    } catch (e) {
      console.warn('draft-events listener error:', e);
    }
  });
}
