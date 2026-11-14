'use client';

import { useCallback, useState } from 'react';

export type HowPointEnded = 'ACE' | 'SERVE_FAULT' | 'WINNER' | 'ERRO_FORCADO' | 'ERRO_NAO_FORCADO';
export type WhereWinner = 'devolvendo' | 'fundo' | 'voleio' | 'passando';
export type AnnotationStep = 'how-ended' | 'ace-details' | 'where-winner' | 'select-winner';

export interface PointAnnotationFlowState {
  step: AnnotationStep;
  howEnded: HowPointEnded | null;
  whereWinner: WhereWinner | null;
  winner: 'player1' | 'player2' | null;
}

const initialFlow: PointAnnotationFlowState = {
  step: 'how-ended',
  howEnded: null,
  whereWinner: null,
  winner: null,
};

export function usePointAnnotationFlow(defaultWinner: 'player1' | 'player2') {
  const [flow, setFlow] = useState<PointAnnotationFlowState>(() => ({
    ...initialFlow,
    winner: defaultWinner,
  }));

  const selectHowEnded = useCallback((option: HowPointEnded) => {
    if (option === 'ACE') {
      setFlow((prev) => ({ ...prev, howEnded: option, step: 'ace-details' }));
      return;
    }
    if (option === 'SERVE_FAULT') {
      setFlow((prev) => ({ ...prev, howEnded: option, step: null as never }));
      return;
    }
    setFlow((prev) => ({ ...prev, howEnded: option, step: 'where-winner' }));
  }, []);

  const selectWhereWinner = useCallback((option: WhereWinner) => {
    setFlow((prev) => ({ ...prev, whereWinner: option, step: 'select-winner' }));
  }, []);

  const selectWinner = useCallback((winner: 'player1' | 'player2') => {
    setFlow((prev) => ({ ...prev, winner }));
  }, []);

  const backToHowEnded = useCallback(() => {
    setFlow((prev) => ({ ...initialFlow, winner: prev.winner }));
  }, []);

  return {
    flow,
    selectHowEnded,
    selectWhereWinner,
    selectWinner,
    backToHowEnded,
    isHowEnded: flow.step === 'how-ended',
    isAceDetails: flow.step === 'ace-details',
    isWhereWinner: flow.step === 'where-winner',
    isSelectWinner: flow.step === 'select-winner',
  };
}
