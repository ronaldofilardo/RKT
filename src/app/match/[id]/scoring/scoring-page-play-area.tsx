'use client';

import { ScoringPlayArea } from './ScoringPlayArea';
import { ScoringAnnotationBarsBlock } from './scoring-annotation-bars';
import type { ServeInlineControlsProps } from '@/components/scoring/serve-inline.types';
import type { ScoringAnnotationFlow } from './use-scoring-annotation-flow';
import {
  useScoringPageChrome,
  type ScoringPageDerived,
  type ScoringPageEffects,
  type ScoringPageState,
} from './use-scoring-page-chrome';

interface ScoringPagePlayAreaProps {
  state: ScoringPageState;
  handlers: ScoringPageEffects;
  derived: ScoringPageDerived;
  chrome: ReturnType<typeof useScoringPageChrome>;
  match: NonNullable<ScoringPageState['match']>;
  matchId: string;
  serveControls: ServeInlineControlsProps;
  annotation: ScoringAnnotationFlow;
  onNavigateReport: () => void;
  onNavigateDashboard: () => void;
}

export function ScoringPagePlayArea({
  state, handlers, derived, chrome, match, matchId,
  serveControls, annotation, onNavigateReport, onNavigateDashboard,
}: ScoringPagePlayAreaProps) {
  const {
    effectiveScoreState, p1IsServing, p2IsServing, activeServerId,
    activeReceiverId, isSetPoint, isBreakPoint, isMatchPoint,
    isTiebreak, isSuperTiebreak, isDecidingPoint, canChangeServer,
    winner, isFinished,
  } = derived;

  return (
    <ScoringPlayArea
      match={match}
      effectiveScoreState={effectiveScoreState}
      suspendedSession={state.suspendedSession}
      liveCounters={chrome.liveCounters}
      tacticalInsights={chrome.tacticalInsights}
      completedSetsCount={derived.editScoreCompletedSets?.length ?? 0}
      p1IsServing={p1IsServing}
      p2IsServing={p2IsServing}
      activeServerId={activeServerId}
      activeReceiverId={activeReceiverId}
      canChangeServer={canChangeServer}
      isSetPoint={isSetPoint}
      isBreakPoint={isBreakPoint}
      isMatchPoint={isMatchPoint}
      isTiebreak={isTiebreak}
      isSuperTiebreak={isSuperTiebreak}
      isDecidingPoint={isDecidingPoint}
      winner={winner}
      pointsHistory={state.pointsHistory}
      scoreState={state.scoreState}
      isFinished={isFinished}
      matchId={matchId}
      serverControls={null}
      isServePanelOpen={serveControls.openAction !== null}
      annotationBars={<ScoringAnnotationBarsBlock annotation={annotation} serveControls={serveControls} />}
      awaitingWinnerSelection={annotation.isSelectWinner}
      onChangeServer={() => state.open('change-server')}
      onSelectReceiverOverride={state.setDecidingPointReceiverOverride}
      onOpenSetSummary={() => chrome.setSetSummaryModalState({ isOpen: true, setNumber: derived.editScoreCompletedSets?.length || 1 })}
      onPoint={annotation.selectWinnerFromCard}
      onSwipeUndo={() => handlers.undoLastPoint()}
      onNavigateReport={onNavigateReport}
      onRegisterAndExit={async () => {
        if (isFinished) await handlers.abandonCurrentSession();
        onNavigateDashboard();
      }}
    />
  );
}
