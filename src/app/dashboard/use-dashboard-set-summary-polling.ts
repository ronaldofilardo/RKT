'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { matchesClient } from '@/services/matchesClient';
import type { ReportTimelineResponse } from '@/services/matches-client-endpoints.logic';

/** Intervalo do refresh leve do resumo de set em partida ao vivo. */
export const SET_SUMMARY_POLL_INTERVAL_MS = 12_000;

interface PollingArgs {
  matchId: string | null;
  enabled: boolean;
  onReport: (matchId: string, data: ReportTimelineResponse) => void;
}

/**
 * Revalida `/report` periodicamente enquanto `enabled` (modal aberto e
 * partida não finalizada). Sem requisições concorrentes e pausado com a aba
 * oculta, para poupar função serverless e compute do banco.
 */
export function useSetSummaryPolling({ matchId, enabled, onReport }: PollingArgs): void {
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;

  useEffect(() => {
    if (!enabled || !matchId) return;
    let inFlight = false;
    const timer = setInterval(async () => {
      if (inFlight || (typeof document !== 'undefined' && document.hidden)) return;
      inFlight = true;
      try {
        onReportRef.current(matchId, await matchesClient.getReportTimeline(matchId));
      } catch (err) {
        logger.warn('[DashboardPage] Falha ao revalidar resumo do set', err);
      } finally {
        inFlight = false;
      }
    }, SET_SUMMARY_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled, matchId]);
}
