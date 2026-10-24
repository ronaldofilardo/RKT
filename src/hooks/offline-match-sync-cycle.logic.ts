import {
  withLocalStorageLock,
  readPendingMatchSyncs,
  writePendingMatchSyncs,
} from "@/lib/offlineStorageSync";
import { logger } from "@/lib/logger";
import { hasPendingPointsForMatch, type PendingMatchSync } from "./offline-match-sync-pending.logic";

async function syncOnePendingMatch(sync: PendingMatchSync): Promise<'success' | 'failed'> {
  try {
    // Coordenação: se houver pontos desta partida ainda pendentes no
    // IndexedDB, adia o finish para não encerrar a partida antes de
    // processar os pontos restantes.
    const hasPending = await hasPendingPointsForMatch(sync.matchId);
    if (hasPending) {
      logger.log(`[useOfflineMatchSync] Partida ${sync.matchId} ainda possui pontos pendentes no IndexedDB — adiando finish.`);
      return 'failed';
    }

    const response = await fetch(`/api/matches/${sync.matchId}/finish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      return 'success';
    }

    if (response.status === 422 || response.status === 400 || response.status === 404) {
      const errorData = await response.json().catch(() => ({}));
      logger.error(`[useOfflineMatchSync] Falha definitiva (${response.status}) ao sincronizar finish de ${sync.matchId}:`, errorData);
      return 'success'; // descarta da fila para evitar loop infinito
    }

    throw new Error(`Server responded with ${response.status}`);
  } catch (err) {
    logger.sync.failed(sync.matchId, err);
    return 'failed';
  }
}

export async function runPendingMatchSyncCycle(): Promise<void> {
  await withLocalStorageLock(async () => {
    const pendingSyncs = readPendingMatchSyncs<PendingMatchSync>();

    if (pendingSyncs.length === 0) return;

    logger.sync.starting(pendingSyncs.length);

    const failedSyncs: PendingMatchSync[] = [];

    const processedMatchIds = new Set(pendingSyncs.map((s) => s.matchId));

    for (const sync of pendingSyncs) {
      const outcome = await syncOnePendingMatch(sync);
      if (outcome === 'failed') failedSyncs.push(sync);
    }

    // Preserva partidas que foram adicionadas concorrentemente enquanto este ciclo rodava
    const currentInStorage = readPendingMatchSyncs<PendingMatchSync>();
    const newlyAddedWhileSyncing = currentInStorage.filter(
      (curr) => !processedMatchIds.has(curr.matchId)
    );
    writePendingMatchSyncs([...failedSyncs, ...newlyAddedWhileSyncing]);

    if (failedSyncs.length > 0) {
      logger.sync.someFailed(failedSyncs.length);
    } else if (pendingSyncs.length > 0) {
      logger.sync.allComplete();
      window.dispatchEvent(new CustomEvent("all-offline-sync-complete"));
    }
  });
}
