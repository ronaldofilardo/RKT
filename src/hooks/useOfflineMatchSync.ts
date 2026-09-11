import { useEffect, useCallback, useRef } from "react";
import { openDB } from "idb";
import {
  withLocalStorageLock,
  readPendingMatchSyncs,
  writePendingMatchSyncs,
} from "@/lib/offlineStorageSync";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";

interface PendingMatchSync {
  matchId: string;
  winnerId: string;
  finishedAt: string;
  timestamp: number;
  type: "MATCH_FINISH";
}

async function hasPendingPointsForMatch(matchId: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return false;
  try {
    const db = await openDB("racket-offline-db", 1);
    if (!db.objectStoreNames.contains("optimistic-queue")) return false;
    const pending = await db.getAllFromIndex("optimistic-queue", "status", "PENDING");
    const syncing = await db.getAllFromIndex("optimistic-queue", "status", "SYNCING");
    return [...pending, ...syncing].some((p: any) => p.matchId === matchId);
  } catch {
    return false;
  }
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
            // Coordenação: se houver pontos desta partida ainda pendentes no
            // IndexedDB, adia o finish para não encerrar a partida antes de
            // processar os pontos restantes.
            const hasPending = await hasPendingPointsForMatch(sync.matchId);
            if (hasPending) {
              logger.log(`[useOfflineMatchSync] Partida ${sync.matchId} ainda possui pontos pendentes no IndexedDB — adiando finish.`);
              failedSyncs.push(sync);
              continue;
            }

            const response = await fetch(`/api/matches/${sync.matchId}/finish`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                winnerId: sync.winnerId,
                finishedAt: sync.finishedAt,
                reason: "COMPLETED",
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
    }, TIMEOUTS.OFFLINE_SYNC_RETRY_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(retryInterval);
    };
  }, [syncPendingMatches]);

  return { syncPendingMatches };
}
