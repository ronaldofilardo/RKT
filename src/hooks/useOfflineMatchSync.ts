import { useEffect, useCallback, useRef } from "react";
import {
  withLocalStorageLock,
  readPendingMatchSyncs,
  writePendingMatchSyncs,
} from "@/lib/offlineStorageSync";
import { logger } from "@/lib/logger";
import { TIMEOUTS_MS } from "@/lib/constants";

interface PendingMatchSync {
  matchId: string;
  winnerId: string;
  finishedAt: string;
  timestamp: number;
  type: "MATCH_FINISH";
}

export function useOfflineMatchSync() {
  const isSyncingRef = useRef(false);

  const syncPendingMatches = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      await withLocalStorageLock(async () => {
        const pendingSyncs = readPendingMatchSyncs<PendingMatchSync>();

        if (pendingSyncs.length === 0) return;

        logger.sync.starting(pendingSyncs.length);

        const token = sessionStorage.getItem("access_token");
        const failedSyncs: PendingMatchSync[] = [];

        for (const sync of pendingSyncs) {
          try {
            const response = await fetch(`/api/matches/${sync.matchId}/finish`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                winnerId: sync.winnerId,
                finishedAt: sync.finishedAt,
              }),
            });

            if (response.ok) {
              logger.sync.success(sync.matchId);
              window.dispatchEvent(new CustomEvent("offline-sync-complete"));
            } else {
              throw new Error(`Server responded with ${response.status}`);
            }
          } catch (err) {
            logger.sync.failed(sync.matchId, err);
            failedSyncs.push(sync);
          }
        }

        writePendingMatchSyncs(failedSyncs);

        if (failedSyncs.length > 0) {
          logger.sync.someFailed(failedSyncs.length);
        } else if (pendingSyncs.length > 0) {
          logger.sync.allComplete();
          window.dispatchEvent(new CustomEvent("all-offline-sync-complete"));
        }
      });
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

    const handleOnline = () => {
      logger.sync.connectionRestored();
      syncPendingMatches();
    };

    window.addEventListener("online", handleOnline);

    const retryInterval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingMatches();
      }
    }, TIMEOUTS_MS.OFFLINE_SYNC_RETRY);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(retryInterval);
    };
  }, [syncPendingMatches]);

  return { syncPendingMatches };
}
