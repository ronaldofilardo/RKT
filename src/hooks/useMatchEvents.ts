'use client';

import { useEffect, useRef, useState } from 'react';
import type { MatchEvent } from '@/lib/match-events';

export function useMatchEvents(matchId: string | null) {
  const [lastEvent, setLastEvent] = useState<MatchEvent | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const es = new EventSource(`/api/matches/${matchId}/events`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event: MatchEvent = JSON.parse(e.data);
        setLastEvent(event);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [matchId]);

  return lastEvent;
}
