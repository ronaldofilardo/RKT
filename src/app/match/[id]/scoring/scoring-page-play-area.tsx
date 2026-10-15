'use client';

import { ScoringPlayArea } from './ScoringPlayArea';
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
  /** `state.match` já estreitado para não-nulo pela página. */
  match: NonNullable<ScoringPageState['match']>;
  matchId: string;
  onNavigateReport: () => void;
  onNavigateDashboard: () => void;
}

export function ScoringPagePlayArea({
  state,
  handlers,
  derived,
  chrome,
  match,
  matchId,
  onNavigateReport,
  onNavigateDashboard,
}: ScoringPagePlayAreaProps) {
  const { scoreState, pointsHistory, suspendedSession } = state;
  const { handlePointFromCard, abandonCurrentSession } = handlers;
  const {
    effectiveScoreState,
    p1IsServing,
    p2IsServing,
    isSetPoint,
    isBreakPoint,
    isMatchPoint,
    isTiebreak,
    isSuperTiebreak,
    winner,
    isFinished,
  } = derived;

  return (
    <ScoringPlayArea
      match={match}
      effectiveScoreState={effectiveScoreState}
      suspendedSession={suspendedSession}
      liveCounters={chrome.liveCounters}
      tacticalInsights={chrome.tacticalInsights}
      completedSetsCount={derived.editScoreCompletedSets?.length ?? 0}
      p1IsServing={p1IsServing}
      p2IsServing={p2IsServing}
      isSetPoint={isSetPoint}
      isBreakPoint={isBreakPoint}
      isMatchPoint={isMatchPoint}
      isTiebreak={isTiebreak}
      isSuperTiebreak={isSuperTiebreak}
      winner={winner}
      pointsHistory={pointsHistory}
      scoreState={scoreState}
      isFinished={isFinished}
      matchId={matchId}
      onOpenSetSummary={() =>
        chrome.setSetSummaryModalState({
          isOpen: true,
          setNumber: derived.editScoreCompletedSets?.length || 1,
        })
      }
      onPoint={handlePointFromCard}
      onSwipeUndo={() => state.open('undo')}
      onNavigateReport={onNavigateReport}
      onRegisterAndExit={async () => {
        if (isFinished) {
          await abandonCurrentSession();
        }
        onNavigateDashboard();
      }}
    />
  );
}
