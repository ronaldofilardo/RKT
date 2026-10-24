import type { IDBPDatabase } from 'idb';
import type { QueuedAction } from '@/schemas/contracts';
import { logger } from '@/lib/logger';
import { markActionSynced } from './offline-sync-marks.logic';

type SequenceMap = Map<string, number>;

export async function fetchMatchSequence(matchId: string): Promise<number> {
  try {
    const response = await fetch(`/api/matches/${matchId}`, {
      headers: {
        'Content-Type': 'application/json',
        
      },
    });
    if (!response.ok) return 0;
    const matchData = await response.json();
    const pointSequence = matchData.lastPointSequence;
    return typeof pointSequence === 'number' ? pointSequence : (matchData.version || 0);
  } catch (err) {
    logger.error('[flush] Failed to fetch match sequence:', err);
    return 0;
  }
}

export async function ensureMatchSequence(
  matchId: string,
  sequences: SequenceMap,
): Promise<number> {
  if (!sequences.has(matchId)) {
    sequences.set(matchId, await fetchMatchSequence(matchId));
  }
  return sequences.get(matchId) || 0;
}

export function createPointRequest(action: QueuedAction, sequenceNumber: number): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      
    },
    body: JSON.stringify({ ...action.payload, sequenceNumber }),
  };
}

export async function retrySequenceConflict(
  db: IDBPDatabase,
  action: QueuedAction,
  response: Response,
  sequences: SequenceMap,
): Promise<boolean> {
  const errorData = await response.json().catch(() => ({}));
  if (errorData.error !== 'SEQUENCE_CONFLICT' || !errorData.expectedSequence) return false;
  const expectedSequence = errorData.expectedSequence;
  sequences.set(action.matchId, expectedSequence - 1);
  const retryResponse = await fetch(
    `/api/matches/${action.matchId}/point`,
    createPointRequest(action, expectedSequence),
  );
  if (!retryResponse.ok) return false;
  await markActionSynced(db, action, expectedSequence, sequences);
  return true;
}
