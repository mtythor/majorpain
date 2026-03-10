/**
 * Sends a welcome/confirmation push to the newly subscribed user.
 * Called by the client after subscription succeeds - confirms OneSignal is working.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendOneSignalNotification } from '@/lib/notifications';
import { toOneSignalExternalId } from '@/lib/onesignal-external-id';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth?.playerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ok = await sendOneSignalNotification({
    contents: { en: "You're all set! You'll get notified when it's your turn to draft and when results are in." },
    headings: { en: 'Major Pain Notifications' },
    includeAliases: { external_id: [toOneSignalExternalId(auth.playerId)] },
  });

  if (!ok) {
    return NextResponse.json({ error: 'Failed to send welcome push' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
