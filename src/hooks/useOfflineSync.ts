"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { logger } from "@/lib/logger";

import { getOfflineDb } from "./use-offline-sync.db";
import {
  flushOfflineQueue,
  dispatchStuckEventIfNeeded,
} from "./use-offline-sync.flush";
import { createOfflineQueueActions } from "./use-offline-sync.queue";
import { attachNetworkListeners } from "./use-offline-sync.network";

export function useOfflineSync() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const queueActions = useMemo(() => createOfflineQueueActions(), []);

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

  useEffect(
    () => attachNetworkListeners({ online, flush, setOnline }),
    [flush, online],
  );

  return {
    ...queueActions,
    flush,
    isOnline: online,
    isSyncing,
  };
}
