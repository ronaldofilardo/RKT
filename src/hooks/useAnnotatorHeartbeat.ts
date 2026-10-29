'use client';

import { useEffect, useRef } from 'react';

export const HEARTBEAT_INTERVAL_MS = 20_000;

export interface UseAnnotatorHeartbeatOptions {
  matchId: string;
  sessionId?: string | null;
  isActive?: boolean;
}

/**
 * Hook de presença do anotador oficial.
 * Dispara batimento cardíaco a cada 20s para informar ao feed de transmissão que o anotador está ativo.
 * Pausa quando offline ou aba oculta. Falhas de rede são silenciosas.
 */
export function useAnnotatorHeartbeat({ matchId, sessionId, isActive = true }: UseAnnotatorHeartbeatOptions) {
  const isSendingRef = useRef(false);

  useEffect(() => {
    if (!matchId || !sessionId || !isActive) return;

    async function sendHeartbeat() {
      if (typeof window === 'undefined' || !navigator.onLine || document.hidden || isSendingRef.current) {
        return;
      }
      isSendingRef.current = true;
      try {
        await fetch(`/api/matches/${matchId}/sessions/${sessionId}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // Falha silenciosa: presença não bloqueia a interface de marcação
      } finally {
        isSendingRef.current = false;
      }
    }

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [matchId, sessionId, isActive]);
}

