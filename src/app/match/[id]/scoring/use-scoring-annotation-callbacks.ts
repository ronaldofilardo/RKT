'use client';

import { useCallback } from 'react';
import type { usePointAnnotationFlow, HowPointEnded, WhereWinner } from '@/components/scoring/usePointAnnotationFlow';
import type { ScoringPageEffects, ScoringPageState } from './use-scoring-page-chrome';

type FlowControls = ReturnType<typeof usePointAnnotationFlow>;

export function useScoringAnnotationCallbacks(
  state: ScoringPageState,
  handlers: ScoringPageEffects,
  flowControls: FlowControls,
  disabled: boolean,
  serveStep: 'first' | 'second',
  onServeAction?: (action: 'ace' | 'out' | 'net') => void,
) {
  const { flow, setStep, setHowEnded, setWhereWinner, setWinner, reset } = flowControls;

  const cancelAnnotation = useCallback(() => {
    reset('player1');
    state.close();
  }, [reset, state]);

  const cancelServe = useCallback(() => {
    setHowEnded(null);
  }, [setHowEnded]);

  const selectHowEnded = useCallback(
    (option: HowPointEnded) => {
      if (disabled) return;
      if (option === 'ACE') {
        setHowEnded('ACE');
        if (onServeAction) onServeAction('ace');
        else handlers.recordAceDirectly();
        return;
      }
      if (option === 'SERVE_FAULT') {
        const isFirst = serveStep === 'first';
        setHowEnded(isFirst ? null : 'SERVE_FAULT');
        if (onServeAction) onServeAction('out');
        else handlers.recordDirectServeError('out', isFirst ? 'first' : 'second');
        return;
      }
      setHowEnded(option);
      setStep('where-winner');
    },
    [disabled, setHowEnded, setStep, onServeAction, handlers, serveStep],
  );

  const confirmAce = useCallback((effect?: string, direction?: string) => {
    handlers.confirmServerEffect(effect, direction);
    reset('player1');
  }, [handlers, reset]);

  const startServeFault = useCallback((errorType: 'out' | 'net') => {
    handlers.startServeErrorDetails(errorType, serveStep);
  }, [handlers, serveStep]);

  const confirmServeFault = useCallback((effect?: string, direction?: string) => {
    handlers.confirmServeError(effect, direction);
    reset('player1');
  }, [handlers, reset]);

  const selectWhereWinner = useCallback((where: WhereWinner) => {
    setWhereWinner(where);
    setStep('select-winner');
  }, [setStep, setWhereWinner]);

  const selectWinnerFromCard = useCallback((side: 'player1' | 'player2') => {
    if (disabled || flow.step !== 'select-winner') return;
    setWinner(side);
    setStep('details');
    state.open('point-details', { winner: side });
  }, [disabled, flow.step, setStep, setWinner, state]);

  return {
    cancelAnnotation, selectHowEnded, cancelServe, confirmAce, startServeFault,
    confirmServeFault, selectWhereWinner, selectWinnerFromCard,
  };
}
