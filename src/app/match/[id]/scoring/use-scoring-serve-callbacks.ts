'use client';

import { useCallback } from 'react';
import type { usePointAnnotationFlow, HowPointEnded } from '@/components/scoring/usePointAnnotationFlow';
import type { ScoringPageEffects, ScoringPageState } from './use-scoring-page-chrome';

type FlowControls = ReturnType<typeof usePointAnnotationFlow>;

interface ServeCallbacksParams {
  state: ScoringPageState;
  handlers: ScoringPageEffects;
  flowControls: FlowControls;
  disabled: boolean;
  serveStep: 'first' | 'second';
  onServeAction?: (action: 'ace' | 'out' | 'net') => void;
}

/** Callbacks do fluxo de saque (ace / falta de saque) da anotação de ponto. */
export function useScoringServeCallbacks({
  state,
  handlers,
  flowControls,
  disabled,
  serveStep,
  onServeAction,
}: ServeCallbacksParams) {
  const { setStep, setHowEnded, reset } = flowControls;

  const cancelServe = useCallback(() => {
    setHowEnded(null);
  }, [setHowEnded]);

  const selectHowEnded = useCallback(
    (option: HowPointEnded) => {
      if (!state.match?.initialServerId || state.match?.state === 'SCHEDULED') {
        state.open('setup');
        return;
      }
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
    [disabled, setHowEnded, setStep, onServeAction, handlers, serveStep, state],
  );

  const confirmAce = useCallback((effect?: string, direction?: string) => {
    handlers.confirmServerEffect(effect, direction);
    reset('player1');
  }, [handlers, reset]);

  const startServeFault = useCallback((errorType: 'out' | 'net') => {
    if (!state.match?.initialServerId || state.match?.state === 'SCHEDULED') {
      state.open('setup');
      return;
    }
    handlers.startServeErrorDetails(errorType, serveStep);
  }, [handlers, serveStep, state]);

  const confirmServeFault = useCallback((effect?: string, direction?: string) => {
    handlers.confirmServeError(effect, direction);
    reset('player1');
  }, [handlers, reset]);

  return { selectHowEnded, cancelServe, confirmAce, startServeFault, confirmServeFault };
}
