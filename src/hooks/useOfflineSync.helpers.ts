import type { IDBPDatabase } from 'idb';
import type { QueuedAction } from '@/schemas/contracts';
import { logger } from '@/lib/logger';

const STORE_NAME = 'optimistic-queue';

type SequenceMap = Map<string, number>;

export async function fetchMatchSequence(matchId: string, accessToken: string): Promise<number> {
  try {
    const response = await fetch(`/api/matches/${matchId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return 0;
    const matchData = await response.json();
    return matchData.version || 0;
  } catch (err) {
    logger.error('[flush] Failed to fetch match sequence:', err);
    return 0;
  }
}

export async function ensureMatchSequence(
  matchId: string,
  accessToken: string,
  sequences: SequenceMap,
): Promise<number> {
  if (!sequences.has(matchId)) {
    sequences.set(matchId, await fetchMatchSequence(matchId, accessToken));
  }
  return sequences.get(matchId) || 0;
}

export function createPointRequest(action: QueuedAction, accessToken: string, sequenceNumber: number): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ ...action.payload, sequenceNumber }),
  };
}

export async function markActionSynced(
  db: IDBPDatabase,
  action: QueuedAction,
  sequence: number,
  sequences: SequenceMap,
): Promise<void> {
  await db.delete(STORE_NAME, action.id);
  window.dispatchEvent(new CustomEvent('offline-sync-complete'));
  sequences.set(action.matchId, sequence);
}

export async function retrySequenceConflict(
  db: IDBPDatabase,
  action: QueuedAction,
  accessToken: string,
  response: Response,
  sequences: SequenceMap,
): Promise<boolean> {
  const errorData = await response.json().catch(() => ({}));
  if (errorData.error !== 'SEQUENCE_CONFLICT' || !errorData.expectedSequence) return false;
  const expectedSequence = errorData.expectedSequence;
  sequences.set(action.matchId, expectedSequence - 1);
  const retryResponse = await fetch(
    `/api/matches/${action.matchId}/point`,
    createPointRequest(action, accessToken, expectedSequence),
  );
  if (!retryResponse.ok) return false;
  await markActionSynced(db, action, expectedSequence, sequences);
  return true;
}

export async function markActionPendingOrFailed(
  db: IDBPDatabase,
  action: QueuedAction,
): Promise<void> {
  await db.put(STORE_NAME, {
    ...action,
    status: action.retries >= 3 ? 'FAILED' : 'PENDING',
    retries: action.retries + 1,
  });
}

export async function markActionPending(db: IDBPDatabase, action: QueuedAction): Promise<void> {
  await db.put(STORE_NAME, {
    ...action,
    status: 'PENDING',
    retries: action.retries + 1,
  });
}
