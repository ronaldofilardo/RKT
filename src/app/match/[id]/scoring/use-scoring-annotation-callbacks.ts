'use client';

import { useCallback } from 'react';
import type { DoublesFormation } from '@/core/scoring/types';
import type { usePointAnnotationFlow, WhereWinner } from '@/components/scoring/usePointAnnotationFlow';
import type { ScoringPageEffects, ScoringPageState } from './use-scoring-page-chrome';
import { useScoringServeCallbacks } from './use-scoring-serve-callbacks';

type FlowControls = ReturnType<typeof usePointAnnotationFlow>;

export function useScoringAnnotationCallbacks(
  state: ScoringPageState,
  handlers: ScoringPageEffects,
  flowControls: FlowControls,
  disabled: boolean,
  serveStep: 'first' | 'second',
  onServeAction?: (action: 'ace' | 'out' | 'net') => void,
  currentServer: 'player1' | 'player2' = 'player1',
) {
  const { flow, setStep, setWhereWinner, setDoublesFormation, setWinner, reset } = flowControls;

  const cancelAnnotation = useCallback(() => {
    reset('player1');
    state.close();
  }, [reset, state]);

  const serve = useScoringServeCallbacks({ state, handlers, flowControls, disabled, serveStep, onServeAction });

  const proceedAfterWhereWinner = useCallback((where: WhereWinner) => {
    if (where === 'devolvendo') {
      const receiver = currentServer === 'player1' ? 'player2' : 'player1';
      setWinner(receiver);
      setStep('details');
      state.open('point-details', { winner: receiver });
      return;
    }
    if (where === 'sacando') {
      const server = currentServer;
      setWinner(server);
      setStep('details');
      state.open('point-details', { winner: server });
      return;
    }
    setStep('select-winner');
  }, [currentServer, setStep, setWinner, state]);

  const selectWhereWinner = useCallback((where: WhereWinner) => {
    setWhereWinner(where);
    const isDoubles = state.match?.matchType === 'DOUBLES';
    const isError = flow.howEnded === 'ERRO_FORCADO' || flow.howEnded === 'ERRO_NAO_FORCADO';
    if (isDoubles && !(isError && where === 'devolvendo')) {
      setStep('doubles-formation');
      return;
    }
    setDoublesFormation(null);
    proceedAfterWhereWinner(where);
  }, [flow.howEnded, proceedAfterWhereWinner, setDoublesFormation, setStep, setWhereWinner, state.match?.matchType]);

  const selectDoublesFormation = useCallback((formation: DoublesFormation) => {
    setDoublesFormation(formation);
    if (flow.whereWinner) proceedAfterWhereWinner(flow.whereWinner);
  }, [flow.whereWinner, proceedAfterWhereWinner, setDoublesFormation]);

  const selectWinnerFromCard = useCallback((side: 'player1' | 'player2') => {
    if (disabled || flow.step !== 'select-winner') return;
    setWinner(side);
    setStep('details');
    state.open('point-details', { winner: side });
  }, [disabled, flow.step, setStep, setWinner, state]);

  return {
    cancelAnnotation, ...serve, selectWhereWinner, selectDoublesFormation, selectWinnerFromCard,
  };
}
