'use client';

import { useMemo, useState } from 'react';
import { computeLiveCounters, detectTacticalTrends } from '@/core/scoring/live-tactical-insights';
import type { TennisFormat } from '@/core/scoring/types';
import { useScoringPageState } from './useScoringPageState';
import { useScoringPageEffects } from './useScoringPageEffects';
import { useScoringPageDerived } from './useScoringPageDerived';
import { useSetSummaryAutoOpen, type SetSummaryModalState } from './scoring-set-summary-auto.logic';

export type ScoringPageState = ReturnType<typeof useScoringPageState>;
export type ScoringPageEffects = ReturnType<typeof useScoringPageEffects>;
export type ScoringPageDerived = ReturnType<typeof useScoringPageDerived>;

export type { SetSummaryModalState };

/**
 * Estado "de chrome" da página: contadores táticos, modal de resumo de set e
 * o carregamento da timeline (BUG FIX 2026-09-27 — buscar o histórico completo
 * ANTES de trocar para a view de timeline, para ela nunca abrir "cortada").
 */
export function useScoringPageChrome(
  state: ScoringPageState,
  handlers: ScoringPageEffects,
  derived: ScoringPageDerived
) {
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  const liveCounters = useMemo(
    () => computeLiveCounters(derived.timelinePoints, state.match?.format as TennisFormat | undefined),
    [derived.timelinePoints, state.match?.format]
  );

  const currentSetNumber = derived.effectiveScoreState?.sets?.length || 1;

  const tacticalInsights = useMemo(
    () =>
      detectTacticalTrends(
        derived.timelinePoints,
        state.match?.player1?.name ?? 'Jogador 1',
        state.match?.player2?.name ?? 'Jogador 2',
        currentSetNumber
      ),
    [
      derived.timelinePoints,
      state.match?.player1?.name,
      state.match?.player2?.name,
      currentSetNumber,
    ]
  );

  const [setSummaryModalState, setSetSummaryModalState] = useState<SetSummaryModalState>({
    isOpen: false,
    setNumber: 1,
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useSetSummaryAutoOpen(
    state,
    derived.editScoreCompletedSets?.length ?? 0,
    setSetSummaryModalState,
    setSummaryModalState.isOpen,
  );

  const openTimelineView = async () => {
    if (isTimelineLoading) return;
    setIsTimelineLoading(true);
    try {
      await handlers.fetchMatch(true);
      await state.fetchTimelinePoints();
    } finally {
      state.setViewMode('timeline');
      setIsTimelineLoading(false);
    }
  };

  return {
    isTimelineLoading,
    liveCounters,
    tacticalInsights,
    setSummaryModalState,
    setSetSummaryModalState,
    isShareModalOpen,
    setIsShareModalOpen,
    openTimelineView,
  };
}
