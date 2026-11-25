'use client';

import { useCallback, useState } from 'react';
import type { DoublesFormation } from '@/core/scoring/types';

export type HowPointEnded = 'ACE' | 'SERVE_FAULT' | 'WINNER' | 'ERRO_FORCADO' | 'ERRO_NAO_FORCADO';
export type WhereWinner = 'devolvendo' | 'sacando' | 'fundo' | 'voleio' | 'passando';

export type AnnotationStep =
  | 'how-ended'
  | 'ace-details'
  | 'serve-fault'
  | 'where-winner'
  | 'doubles-formation'
  | 'select-winner'
  | 'details';

export interface PointAnnotationFlowState {
  step: AnnotationStep;
  howEnded: HowPointEnded | null;
  whereWinner: WhereWinner | null;
  doublesFormation: DoublesFormation | null;
  winner: 'player1' | 'player2';
}

const initialState = (winner: 'player1' | 'player2'): PointAnnotationFlowState => ({
  step: 'how-ended',
  howEnded: null,
  whereWinner: null,
  doublesFormation: null,
  winner,
});

export function usePointAnnotationFlow(defaultWinner: 'player1' | 'player2') {
  const [flow, setFlow] = useState<PointAnnotationFlowState>(() => initialState(defaultWinner));

  const setStep = useCallback((step: AnnotationStep) => {
    setFlow((prev) => ({ ...prev, step }));
  }, []);

  const setHowEnded = useCallback((howEnded: HowPointEnded | null) => {
    setFlow((prev) => ({ ...prev, howEnded }));
  }, []);

  const setWhereWinner = useCallback((whereWinner: WhereWinner) => {
    setFlow((prev) => ({ ...prev, whereWinner }));
  }, []);

  const setDoublesFormation = useCallback((doublesFormation: DoublesFormation | null) => {
    setFlow((prev) => ({ ...prev, doublesFormation }));
  }, []);

  const setWinner = useCallback((winner: 'player1' | 'player2') => {
    setFlow((prev) => ({ ...prev, winner }));
  }, []);

  const backToHowEnded = useCallback(() => {
    setFlow((prev) => initialState(prev.winner));
  }, []);

  const reset = useCallback((winner: 'player1' | 'player2') => {
    setFlow(initialState(winner));
  }, []);

  return {
    flow,
    setStep,
    setHowEnded,
    setWhereWinner,
    setDoublesFormation,
    setWinner,
    backToHowEnded,
    reset,
    isHowEnded: flow.step === 'how-ended',
    isAceDetails: flow.step === 'ace-details',
    isServeFault: flow.step === 'serve-fault',
    isWhereWinner: flow.step === 'where-winner',
    isDoublesFormation: flow.step === 'doubles-formation',
    isSelectWinner: flow.step === 'select-winner',
    isDetails: flow.step === 'details',
  };
}
