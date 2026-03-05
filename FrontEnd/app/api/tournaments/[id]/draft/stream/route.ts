import { onDraftUpdate } from '@/lib/draft-events';

export const dynamic = 'force-dynamic';

/**
 * SSE stream for draft updates.
 * Keeps connection open; sends event when draft state changes (another player made a pick).
 * Client uses EventSource and fetches draft state on message.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // client disconnected
        }
      };

      unsubscribe = onDraftUpdate((id) => {
        if (id === tournamentId) {
          send(JSON.stringify({ type: 'update' }));
        }
      });

      // Send initial heartbeat so client knows connection is open
      send(JSON.stringify({ type: 'connected' }));
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
