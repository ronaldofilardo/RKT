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

  const flush = useCallback(async (accessToken: string) => {
    if (isFlushingRef.current) {
      logger.log('[flush] Sincronização offline já em andamento — ignorando chamada concorrente');
      return;
    }
    isFlushingRef.current = true;
    setIsSyncing(true);

    try {
      const db = await getDb();
      const pending = await db.getAllFromIndex(STORE_NAME, 'status', 'PENDING');
      pending.sort((a, b) => a.timestamp - b.timestamp);

      const matchSequences = new Map<string, number>();

      for (const action of pending) {
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
            continue;
          }

          const retried = await retrySequenceConflict(db, action, accessToken, response, matchSequences);
          if (!retried) {
            await markActionPendingOrFailed(db, action);
          }
        } catch {
          await markActionPending(db, action);
        }
      }
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flush]);

  return { enqueue, flush, clearQueueForMatch, isOnline: online, isSyncing };
}
