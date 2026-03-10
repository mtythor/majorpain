/**
 * Shared external_id format for OneSignal (client + server).
 * Prefix avoids "external_id is blocked" error on raw numeric IDs.
 */
export const ONESIGNAL_EXTERNAL_ID_PREFIX = 'majorpain-';

export function toOneSignalExternalId(playerId: number | string): string {
  return `${ONESIGNAL_EXTERNAL_ID_PREFIX}${playerId}`;
}
