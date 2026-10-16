'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { computeLiveCounters, detectTacticalTrends } from '@/core/scoring/live-tactical-insights';
import { useScoringPageState } from './useScoringPageState';
import { useScoringPageEffects } from './useScoringPageEffects';
import { useScoringPageDerived } from './useScoringPageDerived';

export type ScoringPageState = ReturnType<typeof useScoringPageState>;
export type ScoringPageEffects = ReturnType<typeof useScoringPageEffects>;
export type ScoringPageDerived = ReturnType<typeof useScoringPageDerived>;

export interface SetSummaryModalState {
  isOpen: boolean;
  setNumber: number;
}

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
    () => computeLiveCounters(derived.timelinePoints),
    [derived.timelinePoints]
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
  const completedSetsCountRef = useRef<number>(derived.editScoreCompletedSets?.length ?? 0);

  useEffect(() => {
    const currentCompleted = derived.editScoreCompletedSets?.length ?? 0;
    if (currentCompleted > completedSetsCountRef.current && currentCompleted > 0) {
      setSetSummaryModalState({ isOpen: true, setNumber: currentCompleted });
    }
    completedSetsCountRef.current = currentCompleted;
  }, [derived.editScoreCompletedSets?.length]);

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
    openTimelineView,
  };
}
