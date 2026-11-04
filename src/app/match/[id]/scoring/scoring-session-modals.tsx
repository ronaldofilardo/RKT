import { useState } from 'react';
import { SetupModal } from '@/components/scoring/SetupModal';
import { UndoConfirmModal } from '@/components/scoring/UndoConfirmModal';
import { CommentModal } from '@/components/scoring/CommentModal';
import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
import { DoublesArrangementModal } from '@/components/scoring/DoublesArrangementModal';
import { Game2ServerSelectionModal } from '@/components/scoring/Game2ServerSelectionModal';
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
  const [isGame2ModalDismissed, setIsGame2ModalDismissed] = useState(false);

  const isDoubles = match.matchType === 'DOUBLES' && Boolean(match.player1Partner && match.player2Partner);
  const currentSet = derived.effectiveScoreState?.sets?.[0];
  const completedGamesSet1 = currentSet ? (currentSet.player1 + currentSet.player2) : 0;
  const isGame2Start = Boolean(
    isDoubles &&
    completedGamesSet1 === 1 &&
    derived.effectiveScoreState?.currentGame &&
    derived.effectiveScoreState.currentGame.player1 === 0 &&
    derived.effectiveScoreState.currentGame.player2 === 0 &&
    !derived.effectiveScoreState.currentGame.secondServe &&
    !derived.isFinished &&
    state.activeModal === null
  );

  const showGame2Modal = isGame2Start && !isGame2ModalDismissed;
  const game2ServingSide = derived.effectiveScoreState?.server ?? 'player2';
  const game2TeamName = game2ServingSide === 'player1' ? 'Dupla 1' : 'Dupla 2';
  const game2P1 = game2ServingSide === 'player1' ? match.player1 : match.player2;
  const game2P2 = game2ServingSide === 'player1' ? match.player1Partner! : match.player2Partner!;

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

      {showGame2Modal && (
        <Game2ServerSelectionModal
          isOpen={true}
          onClose={() => setIsGame2ModalDismissed(true)}
          teamName={game2TeamName}
          player1={game2P1}
          player2={game2P2}
          currentServerId={derived.activeServerId}
          onSelectServer={async (serverId) => {
            if (handlers.changeGameServer) {
              await handlers.changeGameServer(serverId);
            }
            setIsGame2ModalDismissed(true);
          }}
        />
      )}

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
