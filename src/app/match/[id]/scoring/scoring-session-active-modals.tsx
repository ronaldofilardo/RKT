import { SetupModal } from '@/components/scoring/SetupModal';
import { UndoConfirmModal } from '@/components/scoring/UndoConfirmModal';
import { CommentModal } from '@/components/scoring/CommentModal';
import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageHandlers } from './useScoringPageEffects';

type Match = NonNullable<ScoringPageState['match']>;

/** Modais disparados por `state.activeModal`: definição de sacador, undo e comentário. */
export function SessionActiveModals({ state, handlers, match }: {
  state: ScoringPageState;
  handlers: ScoringPageHandlers;
  match: Match;
}) {
  return (
    <>
      {state.activeModal === 'setup' && !match.initialServerId && (
        <SetupModal player1={match.player1} player2={match.player2}
          onSelectServer={handlers.confirmMatchSetup} loading={state.setupLoading} />
      )}

      {state.activeModal === 'undo' && (
        <UndoConfirmModal onConfirm={handlers.undoLastPoint} onCancel={state.close} loading={false} />
      )}

      {state.activeModal === 'comment' && process.env.NEXT_PUBLIC_COMMENT_FEATURE === 'true' && (
        <CommentModal isOpen={true} onClose={state.closeAll} onSave={handlers.createMatchComment} />
      )}
    </>
  );
}
