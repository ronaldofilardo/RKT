'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import type { QueuedAction } from '@/schemas/contracts';
import { logger } from '@/lib/logger';

import {
  ensureMatchSequence,
  createPointRequest,
  markActionSynced,
  retrySequenceConflict,
  markActionPendingOrFailed,
  markActionPending,
} from './useOfflineSync.helpers';

const DB_NAME = 'racket-offline-db';
const STORE_NAME = 'optimistic-queue';
const DB_VERSION = 1;

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

export function useOfflineSync() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const enqueue = useCallback(async (action: Omit<QueuedAction, 'id' | 'status' | 'retries'>) => {
    const db = await getDb();
    const queuedAction: QueuedAction = {
      ...action,
      payload: {
        ...action.payload,
        clientEventId: action.payload.clientEventId ?? crypto.randomUUID(),
      },
      id: crypto.randomUUID(),
      status: 'PENDING',
      retries: 0,
    };

    await db.add(STORE_NAME, queuedAction);
    return queuedAction;
  }, []);

  const clearQueueForMatch = useCallback(async (targetMatchId: string) => {
    try {
      const db = await getDb();
      const pending = await db.getAllFromIndex(STORE_NAME, 'status', 'PENDING');
      for (const action of pending) {
        if (action.matchId === targetMatchId) {
          await db.delete(STORE_NAME, action.id);
        }
      }
    } catch (err) {
      logger.error('[clearQueueForMatch] Failed to clear queue:', err);
    }
  }, []);

  const removeLastAction = useCallback(async (targetMatchId: string) => {
    try {
      const db = await getDb();
      const pending = await db.getAllFromIndex(STORE_NAME, 'status', 'PENDING');
      
      const matchActions = pending
        .filter(a => a.matchId === targetMatchId)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (matchActions.length > 0) {
        await db.delete(STORE_NAME, matchActions[0].id);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('[removeLastAction] Failed:', err);
      return false;
    }
  }, []);

  const flush = useCallback(async (accessToken: string) => {
    if (isFlushingRef.current) {
      logger.log('[flush] Sincronização offline já em andamento — ignorando chamada concorrente');
      return;
    }
    isFlushingRef.current = true;
    setIsSyncing(true);
    let syncedAnything = false;

    try {
      const db = await getDb();
      
      // Resgata ações SYNCING que podem ter ficado orfãs em aberturas/fechamentos inesperados
      const syncing = await db.getAllFromIndex(STORE_NAME, 'status', 'SYNCING');
      for (const action of syncing) {
        await db.put(STORE_NAME, { ...action, status: 'PENDING' });
      }

      const pending = await db.getAllFromIndex(STORE_NAME, 'status', 'PENDING');
      pending.sort((a, b) => a.timestamp - b.timestamp);

      const matchSequences = new Map<string, number>();
      const failedMatches = new Set<string>();

      for (const action of pending) {
        if (failedMatches.has(action.matchId)) continue;
        try {
          const currentSequence = await ensureMatchSequence(action.matchId, accessToken, matchSequences);
          const nextSequence = currentSequence + 1;

          await db.put(STORE_NAME, { ...action, status: 'SYNCING' });

          const response = await fetch(
            `/api/matches/${action.matchId}/point`,
            createPointRequest(action, accessToken, nextSequence),
          );

          if (response.ok) {
            await markActionSynced(db, action, nextSequence, matchSequences);
            syncedAnything = true;
            continue;
          }

          const retried = await retrySequenceConflict(db, action, accessToken, response, matchSequences);
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
        window.dispatchEvent(new CustomEvent('offline-sync-complete'));
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      const token = sessionStorage.getItem('access_token');
      if (token) flush(token);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const token = sessionStorage.getItem('access_token');
    
    // Tentar flush na inicialização (e periodicamente quando online)
    if (online && token) {
      flush(token);
    }

    let intervalId: NodeJS.Timeout;
    if (online) {
      intervalId = setInterval(() => {
        const currentToken = sessionStorage.getItem('access_token');
        if (currentToken) flush(currentToken);
      }, 30000); // Tentar a cada 30 segundos
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [flush, online]);

  return { enqueue, flush, clearQueueForMatch, removeLastAction, isOnline: online, isSyncing };
}
