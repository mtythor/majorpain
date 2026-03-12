/**
 * OneSignal push notification helpers.
 * Sends via REST API; uses notification state for deduplication.
 * Uses majorpain- prefix for external_id to match client-side OneSignal.login().
 */

import { toOneSignalExternalId } from './onesignal-external-id';
import { getNotificationState, saveNotificationState } from './notification-state';

const ONESIGNAL_API = 'https://api.onesignal.com/notifications';

function getAppId(): string {
  return (process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID || '').trim();
}

function getRestApiKey(): string {
  return (process.env.ONESIGNAL_REST_API_KEY || '').trim();
}

export interface SendOptions {
  contents: { en: string };
  headings?: { en: string };
  includeAliases?: { external_id: string[] };
  includedSegments?: string[];
}

export async function sendOneSignalNotification(options: SendOptions): Promise<boolean> {
  const appId = getAppId();
  const restApiKey = getRestApiKey();
  if (!appId || !restApiKey) {
    console.warn('OneSignal: missing app ID or REST API key');
    return false;
  }

  const body: Record<string, unknown> = {
    app_id: appId,
    contents: options.contents,
    target_channel: 'push',
  };
  if (options.headings) body.headings = options.headings;
  if (options.includeAliases) body.include_aliases = options.includeAliases;
  if (options.includedSegments) body.included_segments = options.includedSegments;

  try {
    const res = await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${restApiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('OneSignal API error:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('OneSignal send error:', err);
    return false;
  }
}

export async function sendDraftTurnNotification(
  tournamentId: string,
  pickNumber: number,
  nextPlayerId: string,
  tournamentName?: string
): Promise<void> {
  const key = `draft-turn-${tournamentId}-pick${pickNumber}`;
  const sent = await getNotificationState();
  if (sent[key]) return;

  const name = tournamentName || `Tournament ${tournamentId}`;
  const ok = await sendOneSignalNotification({
    contents: { en: `It's your turn to draft in ${name}!` },
    headings: { en: 'Draft Reminder' },
    includeAliases: { external_id: [toOneSignalExternalId(nextPlayerId)] },
  });
  if (ok) {
    sent[key] = true;
    await saveNotificationState(sent);
  }
}

export async function sendStandingsNotification(
  tournamentId: string,
  round: number,
  leaderName: string,
  leaderPoints: number,
  tournamentName?: string
): Promise<void> {
  const key = `standings-${tournamentId}-r${round}`;
  const sent = await getNotificationState();
  if (sent[key]) return;

  const name = tournamentName || `Tournament ${tournamentId}`;
  const ok = await sendOneSignalNotification({
    contents: { en: `Day ${round} complete: ${leaderName} leads with ${leaderPoints} points!` },
    headings: { en: 'Tournament Update' },
    includedSegments: ['Active Subscriptions'],
  });
  if (ok) {
    sent[key] = true;
    await saveNotificationState(sent);
  }
}

export async function sendTournamentWinnerNotification(
  tournamentId: string,
  winnerName: string,
  winnerPoints: number,
  tournamentName?: string
): Promise<void> {
  const key = `winner-${tournamentId}`;
  const sent = await getNotificationState();
  if (sent[key]) return;

  const name = tournamentName || `Tournament ${tournamentId}`;
  const ok = await sendOneSignalNotification({
    contents: { en: `Tournament complete: ${winnerName} wins ${name} with ${winnerPoints} points!` },
    headings: { en: 'Tournament Complete' },
    includedSegments: ['Active Subscriptions'],
  });
  if (ok) {
    sent[key] = true;
    await saveNotificationState(sent);
  }
}

export async function sendSubstitutionReminderNotification(
  tournamentId: string,
  playerIds: string[],
  tournamentName?: string
): Promise<void> {
  const sent = await getNotificationState();
  let changed = false;
  const name = tournamentName || `Tournament ${tournamentId}`;

  for (const playerId of playerIds) {
    const key = `sub-reminder-${tournamentId}-player${playerId}`;
    if (sent[key]) continue;
    const ok = await sendOneSignalNotification({
      contents: { en: `You can substitute your alternate in ${name}! Open the app before the window closes.` },
      headings: { en: 'Substitution Available' },
      includeAliases: { external_id: [toOneSignalExternalId(playerId)] },
    });
    if (ok) {
      sent[key] = true;
      changed = true;
    }
  }

  if (changed) await saveNotificationState(sent);
}
