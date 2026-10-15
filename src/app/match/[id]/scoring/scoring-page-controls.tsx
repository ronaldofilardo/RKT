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
    handleVoltar,
    openAceModal,
    handleAceDirect,
    handleServeErrorDirect,
    handleServeErrorWithModal,
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
        onAceDirect={handleAceDirect}
        onAceWithDetails={openAceModal}
        onOut={(step) => handleServeErrorWithModal('out', step)}
        onNet={(step) => handleServeErrorWithModal('net', step)}
        onOutDirect={(step) => handleServeErrorDirect('out', step)}
        onNetDirect={(step) => handleServeErrorDirect('net', step)}
        onVoltar={handleVoltar}
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
