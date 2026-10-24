import type { IDBPDatabase } from 'idb';
import type { QueuedAction } from '@/schemas/contracts';
import { STORE_NAME } from './offline-sync-store.data';

type SequenceMap = Map<string, number>;

export async function markActionSynced(
  db: IDBPDatabase,
  action: QueuedAction,
  sequence: number,
  sequences: SequenceMap,
): Promise<void> {
  await db.delete(STORE_NAME, action.id);
  sequences.set(action.matchId, sequence);
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

export async function markActionPausedForAuth(
  db: IDBPDatabase,
  action: QueuedAction,
): Promise<void> {
  await db.put(STORE_NAME, {
    ...action,
    status: 'PENDING',
    // não incrementa retries - espera novo login
  });
}

export async function markActionPending(db: IDBPDatabase, action: QueuedAction): Promise<void> {
  await db.put(STORE_NAME, {
    ...action,
    status: 'PENDING',
    retries: action.retries + 1,
  });
}
