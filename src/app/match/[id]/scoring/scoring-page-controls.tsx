'use client';

import { ActionBar } from '@/components/scoring/ActionBar';
import { AnnotationSessionPanel } from '@/components/scoring/AnnotationSessionPanel';
import type { ScoringPageDerived, ScoringPageEffects, ScoringPageState } from './use-scoring-page-chrome';

interface ScoringPageControlsProps {
  state: ScoringPageState;
  handlers: ScoringPageEffects;
  derived: ScoringPageDerived;
  matchId: string;
}

export function ScoringPageControls({ state, handlers, derived, matchId }: ScoringPageControlsProps) {
  const { fontScale, serveErrorState, sessionIdRef, sessionActive, setFontScale } = state;
  const {
    returnToPreviousScreen,
    openAceModal,
    recordAceDirectly,
    recordDirectServeError,
    recordServeErrorWithModal,
    abandonCurrentSession,
  } = handlers;
  const { canUndo, isFinished, isProcessingPoint } = derived;

  return (
    <>
      <ActionBar
        secondServe={false}
        serveStep={serveErrorState.serveStep}
        canUndo={canUndo}
        canEdit={!isFinished}
        fontScale={fontScale}
        isFinished={isFinished}
        isProcessing={isProcessingPoint}
        onAceDirect={recordAceDirectly}
        onAceWithDetails={openAceModal}
        onOut={(step) => recordServeErrorWithModal('out', step)}
        onNet={(step) => recordServeErrorWithModal('net', step)}
        onOutDirect={(step) => recordDirectServeError('out', step)}
        onNetDirect={(step) => recordDirectServeError('net', step)}
        onVoltar={returnToPreviousScreen}
        onFontSmaller={() => setFontScale((f) => Math.max(0.6, f - 0.1))}
        onFontBigger={() => setFontScale((f) => Math.min(2, f + 0.1))}
        onEditScore={() => state.open('edit-score')}
        onComment={
          process.env.NEXT_PUBLIC_COMMENT_FEATURE === 'true'
            ? () => state.open('comment')
            : undefined
        }
      />

      {sessionIdRef.current && (
        <AnnotationSessionPanel
          sessionId={sessionIdRef.current}
          matchId={matchId}
          isActive={sessionActive}
          onStart={() => state.setSessionActive(true)}
          onPause={() => state.setSessionActive(false)}
          onEnd={async () => {
            await abandonCurrentSession();
            state.setSessionActive(false);
          }}
          annotatorCount={1}
        />
      )}
    </>
  );
}
