'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { matchesClient } from '@/services/matchesClient';
import type { ReportTimelineResponse } from '@/services/matches-client-endpoints.logic';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { TimelinePoint } from '@/core/scoring/types';
import { deriveMatchCompletedSets } from '@/core/scoring/completed-sets.logic';
import { unwrapDashboardScoreState } from './dashboard.resume';
import { useSetSummaryPolling } from './use-dashboard-set-summary-polling';

interface FreshReport {
  scoreState: unknown;
  format?: string;
}

/**
 * Abre o modal de análise de set. Placar (`scoreState`) e pontos
 * (`timelinePoints`) vêm da MESMA resposta de `/report`, nunca do snapshot
 * antigo da lista; em partida ao vivo o modal é revalidado periodicamente.
 */
export function useDashboardSetSummary() {
  const [setSummaryMatch, setSetSummaryMatch] = useState<DashboardMatchPayload | null>(null);
  const [setSummaryTimelinePoints, setSetSummaryTimelinePoints] = useState<TimelinePoint[]>([]);
  const [freshReport, setFreshReport] = useState<FreshReport | null>(null);

  // Descarta respostas atrasadas de outra partida ou do modal já fechado.
  const currentMatchIdRef = useRef<string | null>(null);
  currentMatchIdRef.current = setSummaryMatch?.id ?? null;

  const applyReport = useCallback((matchId: string, data: ReportTimelineResponse) => {
    if (currentMatchIdRef.current !== matchId) return;
    if (Array.isArray(data.timelinePoints)) setSetSummaryTimelinePoints(data.timelinePoints);
    if (data.scoreState) setFreshReport({ scoreState: data.scoreState, format: data.format });
  }, []);

  const openMatchSetSummary = useCallback(async (match: DashboardMatchPayload) => {
    logger.info('[DashboardPage] open set summary', match.id);
    currentMatchIdRef.current = match.id;
    setSetSummaryMatch(match);
    setSetSummaryTimelinePoints([]);
    setFreshReport(null);
    try {
      applyReport(match.id, await matchesClient.getReportTimeline(match.id));
    } catch (err) {
      logger.error('[DashboardPage] Erro ao buscar pontos para análise do set', err);
    }
  }, [applyReport]);

  const scoreSource = freshReport?.scoreState ?? setSummaryMatch?.scoreState;
  const format = freshReport?.format ?? setSummaryMatch?.format;
  const completed = useMemo(
    () => deriveMatchCompletedSets(unwrapDashboardScoreState(scoreSource), format),
    [scoreSource, format],
  );

  const isFinished =
    setSummaryMatch?.state === 'FINISHED' ||
    unwrapDashboardScoreState(freshReport?.scoreState)?.isFinished === true;
  useSetSummaryPolling({
    matchId: setSummaryMatch?.id ?? null,
    enabled: Boolean(setSummaryMatch) && !isFinished,
    onReport: applyReport,
  });

  return {
    setSummaryMatch,
    setSetSummaryMatch,
    setSummaryTimelinePoints,
    openMatchSetSummary,
    completedSetsCount: completed.availableSetsCount,
    completedSetsData: completed.setsData,
  };
}
