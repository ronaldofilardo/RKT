'use client';

import { useEffect, useRef, useState } from 'react';
import type { MatchEvent } from '@/lib/match-events';

const INITIAL_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

export function useMatchEvents(matchId: string | null) {
  const [lastEvent, setLastEvent] = useState<MatchEvent | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!matchId) return undefined;

    let disposed = false;

    const clearRetryTimer = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const connect = () => {
      if (disposed || typeof EventSource === 'undefined') return;
      const eventSource = new EventSource(`/api/matches/${matchId}/events`);
      esRef.current = eventSource;

      eventSource.onopen = () => {
        retryCountRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed: MatchEvent = JSON.parse(event.data) as MatchEvent;
          setLastEvent(parsed);
        } catch {
          // Eventos inválidos não devem interromper o stream.
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (disposed) return;
        const retryDelay = Math.min(
          INITIAL_RETRY_MS * 2 ** retryCountRef.current,
          MAX_RETRY_MS,
        );
        retryCountRef.current += 1;
        clearRetryTimer();
        retryTimerRef.current = setTimeout(connect, retryDelay);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearRetryTimer();
      esRef.current?.close();
      esRef.current = null;
    };
  }, [matchId]);

  return lastEvent;
}
