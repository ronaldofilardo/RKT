'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import { computeSetSummary, type SetSummaryReport } from '@/core/scoring/set-summary-stats';

export interface CompletedSetData {
  games: Record<'player1' | 'player2', number>;
  /** `null` quando o set ainda não tem vencedor (em andamento). */
  winner: 'player1' | 'player2' | null;
  /** Ausente = tratado como concluído pelo placar (compatibilidade). */
  isCompleted?: boolean;
  tiebreakScore?: { player1: number; player2: number };
}

interface UseSetSummaryReportArgs {
  initialSetNumber: number;
  completedSetsCount: number;
  timelinePoints: TimelinePoint[];
  completedSetsData?: CompletedSetData[];
  format?: TennisFormat;
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
  format,
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
          isCompleted: completedSetsData[selectedSet - 1].isCompleted,
        }
      : undefined;

    return computeSetSummary(timelinePoints, selectedSet, fallback, format);
  }, [timelinePoints, selectedSet, completedSetsData, format]);

  return { availableSets, selectedSet, setSelectedSet, summary };
}
