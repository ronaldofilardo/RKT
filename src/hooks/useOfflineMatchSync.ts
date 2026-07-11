import { useEffect, useCallback } from "react";

interface PendingMatchSync {
  matchId: string;
  winnerId: string;
  finishedAt: string;
  timestamp: number;
  type: "MATCH_FINISH";
}

export function useOfflineMatchSync() {
  const syncPendingMatches = useCallback(async () => {
    const pendingSyncs = JSON.parse(
      localStorage.getItem("pendingMatchSyncs") || "[]"
    ) as PendingMatchSync[];

    if (pendingSyncs.length === 0) return;

    console.log(`Syncing ${pendingSyncs.length} pending match(es)...`);

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
          console.log(`Successfully synced match ${sync.matchId}`);
        } else {
          throw new Error(`Server responded with ${response.status}`);
        }
      } catch (err) {
        console.error(`Failed to sync match ${sync.matchId}:`, err);
        failedSyncs.push(sync);
      }
    }

    // Salvar apenas os que falharam
    localStorage.setItem("pendingMatchSyncs", JSON.stringify(failedSyncs));

    if (failedSyncs.length > 0) {
      console.warn(`${failedSyncs.length} match(es) still pending sync`);
    } else {
      console.log("All pending matches synced successfully!");
    }
  }, []);

  useEffect(() => {
    // Tentar sincronizar quando montar o componente
    if (navigator.onLine) {
      syncPendingMatches();
    }

    // Listener para quando voltar online
    const handleOnline = () => {
      console.log("Connection restored, attempting sync...");
      syncPendingMatches();
    };

    window.addEventListener("online", handleOnline);

    // Retry periódico a cada 30 segundos
    const retryInterval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingMatches();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(retryInterval);
    };
  }, [syncPendingMatches]);

  return { syncPendingMatches };
}