import type { IDBPDatabase } from "idb";
import type { QueuedAction } from "@/schemas/contracts";
import { STORE_NAME } from "./use-offline-sync.db";
import {
  ensureMatchSequence,
  createPointRequest,
  markActionSynced,
  retrySequenceConflict,
  markActionPendingOrFailed,
  markActionPending,
  markActionPausedForAuth,
} from "./use-offline-sync.logic";
import { OfflineSyncUnauthorizedError } from "./offline-sync-sequence.logic";

export { dispatchStuckEventIfNeeded } from "./use-offline-sync.stuck";

/** Pausa a ação sem incrementar retries e notifica a UI para novo login. */
async function pauseActionForAuth(db: IDBPDatabase, action: QueuedAction, paused: Set<string>): Promise<void> {
  await markActionPausedForAuth(db, action);
  paused.add(action.matchId);
  window.dispatchEvent(new CustomEvent("offline-sync-auth-required", { detail: { matchId: action.matchId } }));
}

export async function flushOfflineQueue(db: IDBPDatabase): Promise<boolean> {
  let syncedAnything = false;

  // Resgata ações SYNCING que podem ter ficado orfãs em aberturas/fechamentos inesperados
  const syncing = await db.getAllFromIndex(STORE_NAME, "status", "SYNCING");
  for (const action of syncing) {
    await db.put(STORE_NAME, { ...action, status: "PENDING" });
  }

  const pending = await db.getAllFromIndex(STORE_NAME, "status", "PENDING");
  const failed = await db.getAllFromIndex(STORE_NAME, "status", "FAILED");
  const toSync = [...pending, ...failed];
  toSync.sort((a, b) => a.timestamp - b.timestamp);

  const matchSequences = new Map<string, number>();
  const failedMatches = new Set<string>();
  const authPausedMatches = new Set<string>();

  for (const action of toSync) {
    if (failedMatches.has(action.matchId)) continue;
    if (authPausedMatches.has(action.matchId)) continue;
    try {
      const currentSequence = await ensureMatchSequence(
        action.matchId,
        matchSequences,
      );
      const nextSequence = currentSequence + 1;

      await db.put(STORE_NAME, { ...action, status: "SYNCING" });

      const response = await fetch(
        `/api/matches/${action.matchId}/point`,
        createPointRequest(action, nextSequence),
      );

      if (response.ok) {
        await markActionSynced(db, action, nextSequence, matchSequences);
        syncedAnything = true;
        continue;
      }

      if (response.status === 401) {
        // Token expirado: pausa sem incrementar retries e notifica a UI
        await pauseActionForAuth(db, action, authPausedMatches);
        continue;
      }

      const retried = await retrySequenceConflict(
        db,
        action,
        response,
        matchSequences,
      );
      if (!retried) {
        await markActionPendingOrFailed(db, action);
        failedMatches.add(action.matchId);
      } else {
        syncedAnything = true;
      }
    } catch (err) {
      if (err instanceof OfflineSyncUnauthorizedError) {
        await pauseActionForAuth(db, action, authPausedMatches);
        continue;
      }
      await markActionPending(db, action);
      failedMatches.add(action.matchId);
    }
  }

  return syncedAnything;
}
