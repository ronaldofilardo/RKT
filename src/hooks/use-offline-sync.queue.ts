import type { QueuedAction } from "@/schemas/contracts";
import { logger } from "@/lib/logger";

import { getOfflineDb, STORE_NAME } from "./use-offline-sync.db";

export function createOfflineQueueActions() {
  const enqueue = async (
    action: Omit<QueuedAction, "id" | "status" | "retries">,
  ): Promise<QueuedAction> => {
    const db = await getOfflineDb();
    const queuedAction: QueuedAction = {
      ...action,
      payload: {
        ...action.payload,
        clientEventId: action.payload.clientEventId ?? crypto.randomUUID(),
      },
      id: crypto.randomUUID(),
      status: "PENDING",
      retries: 0,
    };

    await db.add(STORE_NAME, queuedAction);
    return queuedAction;
  };

  const clearQueueForMatch = async (targetMatchId: string): Promise<void> => {
    try {
      const db = await getOfflineDb();
      const pending = await db.getAllFromIndex(STORE_NAME, "status", "PENDING");
      for (const action of pending) {
        if (action.matchId === targetMatchId) {
          await db.delete(STORE_NAME, action.id);
        }
      }
    } catch (err) {
      logger.error("[clearQueueForMatch] Failed to clear queue:", err);
    }
  };

  const removeLastAction = async (targetMatchId: string): Promise<boolean> => {
    try {
      const db = await getOfflineDb();
      const pending = await db.getAllFromIndex(STORE_NAME, "status", "PENDING");

      const matchActions = pending
        .filter((a) => a.matchId === targetMatchId)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (matchActions.length > 0) {
        await db.delete(STORE_NAME, matchActions[0].id);
        return true;
      }
      return false;
    } catch (err) {
      logger.error("[removeLastAction] Failed:", err);
      return false;
    }
  };

  // Permite que a UI (ex.: um badge no dashboard) saiba quantos pontos
  // anotados ainda não conseguiram ser sincronizados com o servidor, em
  // vez de ficarem presos silenciosamente no IndexedDB do dispositivo.
  const getFailedCount = async (): Promise<number> => {
    try {
      const db = await getOfflineDb();
      const failed = await db.getAllFromIndex(STORE_NAME, "status", "FAILED");
      return failed.length;
    } catch (err) {
      logger.error("[getFailedCount] Failed to read queue:", err);
      return 0;
    }
  };

  return { enqueue, clearQueueForMatch, removeLastAction, getFailedCount };
}
