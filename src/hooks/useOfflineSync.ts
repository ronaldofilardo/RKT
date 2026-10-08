"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { openDB, IDBPDatabase } from "idb";
import type { QueuedAction } from "@/schemas/contracts";
import { logger } from "@/lib/logger";

import {
  ensureMatchSequence,
  createPointRequest,
  markActionSynced,
  retrySequenceConflict,
  markActionPendingOrFailed,
  markActionPending,
  markActionPausedForAuth,
} from "./useOfflineSync.helpers";

const DB_NAME = "racket-offline-db";
const STORE_NAME = "optimistic-queue";
const DB_VERSION = 2;

let cachedDb: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (cachedDb) {
    try {
      // Testa se a conexão ainda está válida acessando uma propriedade interna
      // em vez de .abort() (que lança AbortError visível no console mesmo dentro
      // do catch). Se a conexão foi fechada/terminada, objectStoreNames lançará.
      void cachedDb.objectStoreNames;
      return cachedDb;
    } catch {
      cachedDb = null;
    }
  }

  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("timestamp", "timestamp");
      }
      if (!db.objectStoreNames.contains("optimistic-comment-queue")) {
        const store = db.createObjectStore("optimistic-comment-queue", {
          keyPath: "id",
        });
        store.createIndex("status", "status");
        store.createIndex("timestamp", "timestamp");
      }
    },
    blocked() {
      logger.warn("[IndexedDB] Connection blocked");
    },
    blocking() {
      logger.warn("[IndexedDB] Connection blocking - closing");
      if (cachedDb) {
        cachedDb.close();
        cachedDb = null;
      }
    },
    terminated() {
      logger.warn("[IndexedDB] Connection terminated");
      cachedDb = null;
    },
  });

  cachedDb = db;
  db.onclose = () => {
    cachedDb = null;
  };
  return db;
}

export function useOfflineSync() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const enqueue = useCallback(
    async (action: Omit<QueuedAction, "id" | "status" | "retries">) => {
      const db = await getDb();
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
      const db = await getDb();
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
      const db = await getDb();
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
      const db = await getDb();

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
            // Token expirado: pausa a sincronização desta partida
            // mantém como PENDING sem incrementar retries
            await markActionPausedForAuth(db, action);
            authPausedMatches.add(action.matchId);
            // Notifica a UI que precisa fazer login
            window.dispatchEvent(
              new CustomEvent("offline-sync-auth-required", {
                detail: { matchId: action.matchId },
              }),
            );
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
        } catch {
          await markActionPending(db, action);
          failedMatches.add(action.matchId);
        }
      }
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
      if (syncedAnything) {
        window.dispatchEvent(new CustomEvent("offline-sync-complete"));
      }
      try {
        const db = await getDb();
        const stillFailed = await db.getAllFromIndex(
          STORE_NAME,
          "status",
          "FAILED",
        );
        if (stillFailed.length > 0) {
          window.dispatchEvent(
            new CustomEvent("offline-sync-stuck", {
              detail: { count: stillFailed.length },
            }),
          );
        }
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
      const db = await getDb();
      const failed = await db.getAllFromIndex(STORE_NAME, "status", "FAILED");
      return failed.length;
    } catch (err) {
      logger.error("[getFailedCount] Failed to read queue:", err);
      return 0;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      flush();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    
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
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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
