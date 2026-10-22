"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { QueuedAction } from "@/schemas/contracts";
import { logger } from "@/lib/logger";

import { getOfflineDb, STORE_NAME } from "./use-offline-sync.db";
import {
  flushOfflineQueue,
  dispatchStuckEventIfNeeded,
} from "./use-offline-sync.flush";

export function useOfflineSync() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const enqueue = useCallback(
    async (action: Omit<QueuedAction, "id" | "status" | "retries">) => {
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
    },
    [],
  );

  const clearQueueForMatch = useCallback(async (targetMatchId: string) => {
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
  }, []);

  const removeLastAction = useCallback(async (targetMatchId: string) => {
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
  }, []);

  const flush = useCallback(async () => {
    if (isFlushingRef.current) {
      logger.log(
        "[flush] Sincronização offline já em andamento — ignorando chamada concorrente",
      );
      return;
    }
    isFlushingRef.current = true;
    setIsSyncing(true);
    let syncedAnything = false;

    try {
      const db = await getOfflineDb();
      syncedAnything = await flushOfflineQueue(db);
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
      if (syncedAnything) {
        window.dispatchEvent(new CustomEvent("offline-sync-complete"));
      }
      try {
        const db = await getOfflineDb();
        await dispatchStuckEventIfNeeded(db);
      } catch (err) {
        logger.error("[flush] Failed to check stuck actions:", err);
      }
    }
  }, []);

  // Permite que a UI (ex.: um badge no dashboard) saiba quantos pontos
  // anotados ainda não conseguiram ser sincronizados com o servidor, em
  // vez de ficarem presos silenciosamente no IndexedDB do dispositivo.
  const getFailedCount = useCallback(async (): Promise<number> => {
    try {
      const db = await getOfflineDb();
      const failed = await db.getAllFromIndex(STORE_NAME, "status", "FAILED");
      return failed.length;
    } catch (err) {
      logger.error("[getFailedCount] Failed to read queue:", err);
      return 0;
    }
  }, []);

  useEffect(() => {
    const onNetworkOnline = () => {
      setOnline(true);
      flush();
    };

    const onNetworkOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", onNetworkOnline);
    window.addEventListener("offline", onNetworkOffline);

    // Tentar flush na inicialização (e periodicamente quando online)
    if (online) {
      flush();
    }

    let intervalId: NodeJS.Timeout;
    if (online) {
      intervalId = setInterval(() => {
        flush();
      }, 30000); // Tentar a cada 30 segundos
    }

    return () => {
      window.removeEventListener("online", onNetworkOnline);
      window.removeEventListener("offline", onNetworkOffline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [flush, online]);

  return {
    enqueue,
    flush,
    clearQueueForMatch,
    removeLastAction,
    isOnline: online,
    isSyncing,
    getFailedCount,
  };
}
