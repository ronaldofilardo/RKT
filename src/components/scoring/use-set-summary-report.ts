'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import { computeSetSummary, type SetSummaryReport } from '@/core/scoring/set-summary-stats';

export interface CompletedSetData {
  games: Record<'player1' | 'player2', number>;
  winner: 'player1' | 'player2';
  tiebreakScore?: { player1: number; player2: number };
}

interface UseSetSummaryReportArgs {
  initialSetNumber: number;
  completedSetsCount: number;
  timelinePoints: TimelinePoint[];
  completedSetsData?: CompletedSetData[];
}

/**
 * Estado do resumo de set: abas disponíveis, set selecionado (sincronizado
 * com `initialSetNumber`) e o relatório calculado via `computeSetSummary`.
 */
export function useSetSummaryReport({
  initialSetNumber,
  completedSetsCount,
  timelinePoints,
  completedSetsData,
}: UseSetSummaryReportArgs) {
  const availableSets = useMemo(() => {
    const count = Math.max(1, completedSetsCount);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [completedSetsCount]);

  const [selectedSet, setSelectedSet] = useState<number>(initialSetNumber);

  // Sincronizar se initialSetNumber mudar
  useEffect(() => {
    if (initialSetNumber) {
      setSelectedSet(initialSetNumber);
    }
  }, [initialSetNumber]);

  const summary = useMemo<SetSummaryReport>(() => {
    const fallback = completedSetsData && completedSetsData[selectedSet - 1]
      ? {
          player1: completedSetsData[selectedSet - 1].games.player1,
          player2: completedSetsData[selectedSet - 1].games.player2,
          tiebreakScore: completedSetsData[selectedSet - 1].tiebreakScore,
        }
      : undefined;

    return computeSetSummary(timelinePoints, selectedSet, fallback);
  }, [timelinePoints, selectedSet, completedSetsData]);

  return { availableSets, selectedSet, setSelectedSet, summary };
}
