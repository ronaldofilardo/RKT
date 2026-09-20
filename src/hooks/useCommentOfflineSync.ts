'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';

export interface QueuedCommentAction {
  id: string;
  matchId: string;
  type: 'COMMENT';
  payload: {
    content: string;
    category?: string | null;
    pointId?: string | null;
    audioBlob?: Blob;
    audioDurationMs?: number;
  };
  timestamp: number;
  retries: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

const DB_NAME = 'racket-offline-db';
const DB_VERSION = 2;
const COMMENT_STORE = 'optimistic-comment-queue';

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // v1 store (points) — already exists if DB was created before
      if (!db.objectStoreNames.contains('optimistic-queue')) {
        const store = db.createObjectStore('optimistic-queue', { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
      }
      // v2 store (comments)
      if (!db.objectStoreNames.contains(COMMENT_STORE)) {
        const store = db.createObjectStore(COMMENT_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

export function useCommentOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const enqueueComment = useCallback(async (
    action: Omit<QueuedCommentAction, 'id' | 'status' | 'retries'>
  ) => {
    const db = await getDb();
    const queued: QueuedCommentAction = {
      ...action,
      id: crypto.randomUUID(),
      status: 'PENDING',
      retries: 0,
    };
    await db.add(COMMENT_STORE, queued);
    return queued;
  }, []);

  const flushComments = useCallback(async (accessToken: string) => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    setIsSyncing(true);

    try {
      const db = await getDb();
      const pending = await db.getAllFromIndex(COMMENT_STORE, 'status', 'PENDING');
      pending.sort((a, b) => a.timestamp - b.timestamp);

      for (const action of pending) {
        try {
          await db.put(COMMENT_STORE, { ...action, status: 'SYNCING' });

          // 1. Create comment
          const res = await fetch(`/api/matches/${action.matchId}/comments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              content: action.payload.content,
              category: action.payload.category,
              pointId: action.payload.pointId,
            }),
          });

          if (!res.ok) {
            action.retries += 1;
            await db.put(COMMENT_STORE, {
              ...action,
              status: action.retries >= 3 ? 'FAILED' : 'PENDING',
            });
            continue;
          }

          const comment = await res.json();

          // 2. Upload audio if present
          if (action.payload.audioBlob && action.payload.audioDurationMs && comment.id) {
            const formData = new FormData();
            formData.append('file', action.payload.audioBlob);
            formData.append('durationMs', String(action.payload.audioDurationMs));
            await fetch(`/api/matches/${action.matchId}/comments/${comment.id}/audio`, {
              method: 'POST',
              headers: { authorization: `Bearer ${accessToken}` },
              body: formData,
            });
          }

          // 3. Remove from queue
          await db.delete(COMMENT_STORE, action.id);
          window.dispatchEvent(new CustomEvent('offline-sync-complete', { detail: { type: 'comment' } }));
        } catch {
          action.retries += 1;
          await db.put(COMMENT_STORE, {
            ...action,
            status: action.retries >= 3 ? 'FAILED' : 'PENDING',
          });
        }
      }
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      const token = sessionStorage.getItem('access_token');
      if (token) flushComments(token);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushComments]);

  return { enqueueComment, flushComments, isSyncing };
}
