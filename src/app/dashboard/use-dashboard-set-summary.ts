'use client';

import { useCallback, useMemo, useState } from 'react';
import { logger } from '@/lib/logger';
import { matchesClient } from '@/services/matchesClient';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { TimelinePoint } from '@/core/scoring/types';
import { unwrapDashboardScoreState } from './dashboard.resume';

/** Conta os sets concluídos (com fallback para o total de sets e mínimo 1). */
function countCompletedSets(scoreState: unknown): number {
  const sets = unwrapDashboardScoreState(scoreState)?.sets;
  if (!sets) return 1;
  const count = sets.filter((s) => {
    return ((s.player1 >= 6 || s.player2 >= 6) && Math.abs(s.player1 - s.player2) >= 2) ||
      Boolean(s.isTiebreak) ||
      Boolean(s.tiebreakScore);
  }).length;
  return count || sets.length || 1;
}

function mapCompletedSets(scoreState: unknown) {
  const sets = unwrapDashboardScoreState(scoreState)?.sets;
  if (!sets) return [];
  return sets.map((s) => ({
    games: { player1: s.player1 ?? 0, player2: s.player2 ?? 0 },
    winner: (s.player1 > s.player2 ? 'player1' : 'player2') as 'player1' | 'player2',
    tiebreakScore: s.tiebreakScore ?? undefined,
  }));
}

/** Abre o modal de análise de set buscando o histórico de pontos do relatório. */
export function useDashboardSetSummary() {
  const [setSummaryMatch, setSetSummaryMatch] = useState<DashboardMatchPayload | null>(null);
  const [setSummaryTimelinePoints, setSetSummaryTimelinePoints] = useState<TimelinePoint[]>([]);

  const openMatchSetSummary = useCallback(async (match: DashboardMatchPayload) => {
    logger.info('[DashboardPage] open set summary', match.id);
    setSetSummaryMatch(match);
    setSetSummaryTimelinePoints([]);
    try {
      const data = await matchesClient.getReportTimeline(match.id);
      if (Array.isArray(data.timelinePoints)) {
        setSetSummaryTimelinePoints(data.timelinePoints);
      }
    } catch (err) {
      logger.error('[DashboardPage] Erro ao buscar pontos para análise do set', err);
    }
  }, []);

  const completedSetsCount = useMemo(
    () => countCompletedSets(setSummaryMatch?.scoreState),
    [setSummaryMatch]
  );

  const completedSetsData = useMemo(
    () => mapCompletedSets(setSummaryMatch?.scoreState),
    [setSummaryMatch]
  );

  return {
    setSummaryMatch,
    setSetSummaryMatch,
    setSummaryTimelinePoints,
    openMatchSetSummary,
    completedSetsCount,
    completedSetsData,
  };
}
