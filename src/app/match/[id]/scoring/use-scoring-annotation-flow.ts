'use client';

import { useEffect, useRef } from 'react';
import { usePointAnnotationFlow } from '@/components/scoring/usePointAnnotationFlow';
import { resolveRallyTipo, resolveRallySituacao } from './scoring-annotation-flow.types';
import { useScoringAnnotationCallbacks } from './use-scoring-annotation-callbacks';
import type { ScoringPageDerived, ScoringPageEffects, ScoringPageState } from './use-scoring-page-chrome';

export interface ScoringAnnotationFlowOptions {
  onServeAction?: (action: 'ace' | 'out' | 'net') => void;
  dfDetailsEnabled?: boolean;
}

export function useScoringAnnotationFlow(
  state: ScoringPageState,
  handlers: ScoringPageEffects,
  derived: ScoringPageDerived,
  options?: ScoringAnnotationFlowOptions,
) {
  const annotation = usePointAnnotationFlow('player1');
  const { flow, backToHowEnded, reset } = annotation;

  const disabled = Boolean(derived.isFinished || derived.isProcessingPoint);
  const isActive = !derived.isFinished;
  const serveStep = state.serveErrorState?.serveStep === 'second' ? 'second' : 'first';
  const hasFirstServeError = Boolean(state.serveErrorState?.firstServeError);

  const pointCount = state.pointsHistory?.length ?? 0;
  const lastPointCountRef = useRef(pointCount);
  useEffect(() => {
    if (pointCount !== lastPointCountRef.current) {
      lastPointCountRef.current = pointCount;
      reset('player1');
    }
  }, [pointCount, reset]);

  const callbacks = useScoringAnnotationCallbacks(
    state,
    handlers,
    annotation,
    disabled,
    serveStep,
    options?.onServeAction,
  );

  return {
    flow,
    isActive,
    hasFirstServeError,
    serveStep: state.serveErrorState?.serveStep ?? 'none',
    disabled,
    tipo: resolveRallyTipo(flow.howEnded),
    situacao: resolveRallySituacao(flow.whereWinner),
    isHowEnded: isActive && annotation.isHowEnded,
    isAceDetails: isActive && annotation.isAceDetails,
    isServeFault: isActive && annotation.isServeFault,
    isWhereWinner: isActive && annotation.isWhereWinner,
    isSelectWinner: isActive && annotation.isSelectWinner,
    isDetails: isActive && annotation.isDetails,
    backToHowEnded,
    ...callbacks,
  };
}

export type ScoringAnnotationFlow = ReturnType<typeof useScoringAnnotationFlow>;
