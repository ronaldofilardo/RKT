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

async function markRetry(
  db: NonNullable<Awaited<ReturnType<typeof getOfflineDb>>>,
  action: QueuedCommentAction,
): Promise<void> {
  action.retries += 1;
  await db.put(COMMENT_STORE_NAME, {
    ...action,
    status: action.retries >= 3 ? 'FAILED' : 'PENDING',
  });
}

async function processOneComment(
  db: NonNullable<Awaited<ReturnType<typeof getOfflineDb>>>,
  action: QueuedCommentAction,
  accessToken: string,
): Promise<'done' | 'retry'> {
  await db.put(COMMENT_STORE_NAME, { ...action, status: 'SYNCING' });

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
    await markRetry(db, action);
    return 'retry';
  }

  const comment = await res.json();

  // 2. Upload audio if present
  if (action.payload.audioBlob && action.payload.audioDurationMs && comment.id) {
    const formData = new FormData();
    formData.append('file', action.payload.audioBlob);
    formData.append('durationMs', String(action.payload.audioDurationMs));
    const audioRes = await fetch(`/api/matches/${action.matchId}/comments/${comment.id}/audio`, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    if (!audioRes.ok) {
      await markRetry(db, action);
      return 'retry';
    }
  }

  // 3. Remove from queue
  await db.delete(COMMENT_STORE_NAME, action.id);
  window.dispatchEvent(new CustomEvent('offline-sync-complete', { detail: { type: 'comment' } }));
  return 'done';
}

export async function flushCommentsQueue(accessToken: string): Promise<void> {
  const db = await getOfflineDb();
  const pending = await db.getAllFromIndex(COMMENT_STORE_NAME, 'status', 'PENDING');
  pending.sort((a, b) => a.timestamp - b.timestamp);

  for (const action of pending) {
    try {
      await processOneComment(db, action, accessToken);
    } catch {
      await markRetry(db, action);
    }
  }
}
