import { useState } from 'react';
import { SetupModal } from '@/components/scoring/SetupModal';
import { UndoConfirmModal } from '@/components/scoring/UndoConfirmModal';
import { CommentModal } from '@/components/scoring/CommentModal';
import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
import { DoublesArrangementModal } from '@/components/scoring/DoublesArrangementModal';
import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageHandlers } from './useScoringPageEffects';
import type { ScoringPageDerived } from './useScoringPageDerived';

interface ScoringSessionModalsProps {
  state: ScoringPageState;
  handlers: ScoringPageHandlers;
  derived: ScoringPageDerived;
  match: NonNullable<ScoringPageState['match']>;
  setSummaryModalState: { isOpen: boolean; setNumber: number };
  onCloseSetSummary: () => void;
  onNavigateReport: () => void;
}

export function ScoringSessionModals({
  state,
  handlers,
  derived,
  match,
  setSummaryModalState,
  onCloseSetSummary,
  onNavigateReport,
}: ScoringSessionModalsProps) {
  const [isArrangementOpen, setIsArrangementOpen] = useState(false);

  return (
    <>
      {state.activeModal === 'setup' && !match.initialServerId && (
        <SetupModal
          player1={match.player1}
          player2={match.player2}
          onSelectServer={handlers.confirmMatchSetup}
          loading={state.setupLoading}
        />
      )}

      {state.activeModal === 'undo' && (
        <UndoConfirmModal
          onConfirm={handlers.undoLastPoint}
          onCancel={state.close}
          loading={false}
        />
      )}

      {state.activeModal === 'comment' && process.env.NEXT_PUBLIC_COMMENT_FEATURE === 'true' && (
        <CommentModal
          isOpen={true}
          onClose={state.closeAll}
          onSave={handlers.createMatchComment}
        />
      )}

      <SetSummaryModal
        isOpen={setSummaryModalState.isOpen}
        onClose={onCloseSetSummary}
        timelinePoints={derived.timelinePoints}
        player1Name={match.player1.name} player2Name={match.player2.name}
        initialSetNumber={setSummaryModalState.setNumber}
        completedSetsCount={derived.editScoreCompletedSets?.length ?? 0}
        completedSetsData={derived.editScoreCompletedSets}
        format={match.format as any}
        isMatchFinished={derived.isFinished}
        onViewReport={onNavigateReport}
        onOpenDoublesArrangement={
          match.matchType === 'DOUBLES' && match.player1Partner && match.player2Partner
            ? () => setIsArrangementOpen(true)
            : undefined
        }
      />

      {match.matchType === 'DOUBLES' && match.player1Partner && match.player2Partner && (
        <DoublesArrangementModal
          isOpen={isArrangementOpen}
          onClose={() => setIsArrangementOpen(false)}
          onConfirm={async (arr) => {
            if (handlers.updateDoublesArrangement) {
              await handlers.updateDoublesArrangement(arr);
            }
          }}
          player1={match.player1}
          player1Partner={match.player1Partner}
          player2={match.player2}
          player2Partner={match.player2Partner}
          currentArrangement={derived.effectiveScoreState?.doubles}
          currentSetIndex={derived.editScoreCompletedSets?.length ?? 1}
        />
      )}
    </>
  );
}
