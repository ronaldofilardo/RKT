import { useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import { runPendingMatchSyncCycle } from "./offline-match-sync-cycle.logic";

export function useOfflineMatchSync() {
  const isSyncingRef = useRef(false);

  const syncPendingMatches = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      await runPendingMatchSyncCycle();
    } catch (err) {
      logger.warn("[useOfflineMatchSync] Lock held por outro caller — skip ciclo:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (navigator.onLine) {
      syncPendingMatches();
    }

    const onNetworkOnline = () => {
      logger.sync.connectionRestored();
      syncPendingMatches();
    };

    window.addEventListener("online", onNetworkOnline);

    const retryInterval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingMatches();
      }
    }, TIMEOUTS.OFFLINE_SYNC_RETRY_MS);

    return () => {
      window.removeEventListener("online", onNetworkOnline);
      clearInterval(retryInterval);
    };
  }, [syncPendingMatches]);

  return { syncPendingMatches };
}
