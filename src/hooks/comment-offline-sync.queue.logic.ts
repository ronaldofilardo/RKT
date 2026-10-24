'use client';

import { getOfflineDb, COMMENT_STORE_NAME } from './use-offline-sync.db';

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

export async function enqueueComment(
  action: Omit<QueuedCommentAction, 'id' | 'status' | 'retries'>
): Promise<QueuedCommentAction> {
  const db = await getOfflineDb();
  const queued: QueuedCommentAction = {
    ...action,
    id: crypto.randomUUID(),
    status: 'PENDING',
    retries: 0,
  };
  await db.add(COMMENT_STORE_NAME, queued);
  return queued;
}
