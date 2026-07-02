'use client';

import { useCallback } from 'react';
import type { AnnotationSession, EndSessionInput, MarkSessionAbandonedInput } from '@/schemas/contracts';

async function getSessionToken(): Promise<string | null> {
  return sessionStorage.getItem('access_token');
}

export async function listSessions(matchId: string): Promise<AnnotationSession[]> {
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list sessions');
  }

  return response.json();
}

export async function startSession(
  matchId: string,
  autoStarted = false,
): Promise<AnnotationSession> {
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ autoStarted }),
  });

  if (!response.ok) {
    throw new Error('Failed to start session');
  }

  return response.json();
}

export async function endSession(
  matchId: string,
  sessionId: string,
  finalState?: unknown,
  status: 'COMPLETED' | 'ABANDONED' = 'ABANDONED',
): Promise<AnnotationSession> {
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status,
      ...(finalState ? { finalState } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to end session');
  }

  return response.json();
}

export async function endorseSession(matchId: string, sessionId: string): Promise<unknown> {
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions/${sessionId}/endorse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error('Failed to endorse session');
  }

  return response.json();
}

export async function markSessionAbandoned({
  matchId,
  sessionId,
  matchStateSnapshot,
}: {
  matchId: string;
  sessionId: string;
  matchStateSnapshot?: string;
}): Promise<void> {
  const token = await getSessionToken();

  const url = `/api/matches/${matchId}/sessions/${sessionId}/abandon`;

  try {
    fetch(url, {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ matchStateSnapshot }),
    }).catch(() => {
      // Silent fail em keepalive
    });
  } catch {
    // Silent fail em fetch
  }
}

export function useAnnotationSession() {
  const start = useCallback(async (matchId: string, autoStarted = false) => {
    return startSession(matchId, autoStarted);
  }, []);

  const end = useCallback(async (
    matchId: string,
    sessionId: string,
    finalState?: unknown,
    status?: 'COMPLETED' | 'ABANDONED',
  ) => {
    return endSession(matchId, sessionId, finalState, status);
  }, []);

  const abandon = useCallback(async (matchId: string, sessionId: string, matchStateSnapshot: string) => {
    await markSessionAbandoned({ matchId, sessionId, matchStateSnapshot });
  }, []);

  const endorse = useCallback(async (matchId: string, sessionId: string) => {
    return endorseSession(matchId, sessionId);
  }, []);

  return { start, end, abandon, endorse };
}