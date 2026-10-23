"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { logger } from "@/lib/logger";

import { getOfflineDb } from "./use-offline-sync.db";
import {
  flushOfflineQueue,
  dispatchStuckEventIfNeeded,
} from "./use-offline-sync.flush";
import { createOfflineQueueActions } from "./use-offline-sync.queue";

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
    ...queueActions,
    flush,
    isOnline: online,
    isSyncing,
  };
}
