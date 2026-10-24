'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { enqueueComment as enqueueToQueue, flushCommentsQueue, type QueuedCommentAction } from './comment-offline-sync.queue.logic';

export function useCommentOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const enqueueComment = useCallback(async (
    action: Omit<QueuedCommentAction, 'id' | 'status' | 'retries'>
  ) => enqueueToQueue(action), []);

  const flushComments = useCallback(async (accessToken: string) => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    setIsSyncing(true);

    try {
      await flushCommentsQueue(accessToken);
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const onNetworkOnline = () => {
      const token = sessionStorage.getItem('access_token');
      if (token) flushComments(token);
    };
    window.addEventListener('online', onNetworkOnline);
    return () => window.removeEventListener('online', onNetworkOnline);
  }, [flushComments]);

  return { enqueueComment, flushComments, isSyncing };
}
