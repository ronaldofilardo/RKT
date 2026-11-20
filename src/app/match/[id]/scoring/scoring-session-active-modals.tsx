import { SetupModal } from '@/components/scoring/SetupModal';
import { DoublesServerSelectionModal } from '@/app/match/new/components/DoublesServerSelectionModal';
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
  const isDoubles = match.matchType === 'DOUBLES';

  return (
    <>
      {state.activeModal === 'setup' && !match.initialServerId && (
        isDoubles ? (
          <DoublesServerSelectionModal
            isOpen={true}
            selectedP1={match.player1}
            selectedP1Partner={match.player1Partner ?? null}
            selectedP2={match.player2}
            selectedP2Partner={match.player2Partner ?? null}
            startingMatch={state.setupLoading}
            onConfirmDoublesSetup={(initialServerId, setup) => handlers.confirmMatchSetup(initialServerId, setup)}
            onClose={state.close}
          />
        ) : (
          <SetupModal
            player1={match.player1}
            player2={match.player2}
            onSelectServer={(serverId) => handlers.confirmMatchSetup(serverId)}
            loading={state.setupLoading}
          />
        )
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
