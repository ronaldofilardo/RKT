import { SetupModal } from '@/components/scoring/SetupModal';
import { UndoConfirmModal } from '@/components/scoring/UndoConfirmModal';
import { CommentModal } from '@/components/scoring/CommentModal';
import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
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
  return (
    <>
      {state.activeModal === 'setup' && !match.initialServerId && (
        <SetupModal
          player1={match.player1}
          player2={match.player2}
          onSelectServer={handlers.handleSetupConfirm}
          loading={state.setupLoading}
        />
      )}

      {state.activeModal === 'undo' && (
        <UndoConfirmModal
          onConfirm={handlers.handleUndo}
          onCancel={state.close}
          loading={false}
        />
      )}

      {state.activeModal === 'comment' && process.env.NEXT_PUBLIC_COMMENT_FEATURE === 'true' && (
        <CommentModal
          isOpen={true}
          onClose={state.closeAll}
          onSave={handlers.handleCommentCreate}
        />
      )}

      <SetSummaryModal
        isOpen={setSummaryModalState.isOpen}
        onClose={onCloseSetSummary}
        timelinePoints={derived.timelinePoints}
        player1Name={match.player1.name}
        player2Name={match.player2.name}
        initialSetNumber={setSummaryModalState.setNumber}
        completedSetsCount={derived.editScoreCompletedSets?.length ?? 0}
        completedSetsData={derived.editScoreCompletedSets}
        isMatchFinished={derived.isFinished}
        onViewReport={onNavigateReport}
      />
    </>
  );
}
