import { useState } from 'react';
import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
import { DoublesArrangementModal } from '@/components/scoring/DoublesArrangementModal';
import { Game2ServerSelectionModal } from '@/components/scoring/Game2ServerSelectionModal';
import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageHandlers } from './useScoringPageEffects';
import type { ScoringPageDerived } from './useScoringPageDerived';
import { SessionActiveModals } from './scoring-session-active-modals';
import { deriveGame2Selection } from './scoring-session-game2.logic';

interface ScoringSessionModalsProps {
  state: ScoringPageState;
  handlers: ScoringPageHandlers;
  derived: ScoringPageDerived;
  match: NonNullable<ScoringPageState['match']>;
  setSummaryModalState: { isOpen: boolean; setNumber: number };
  onCloseSetSummary: () => void;
  onNavigateReport: () => void;
}

export function ScoringSessionModals({ state, handlers, derived, match, setSummaryModalState, onCloseSetSummary, onNavigateReport }: ScoringSessionModalsProps) {
  const [isArrangementOpen, setIsArrangementOpen] = useState(false);
  const [isGame2ModalDismissed, setIsGame2ModalDismissed] = useState(false);

  const { showGame2Modal, teamName: game2TeamName, player1: game2P1, player2: game2P2 } =
    deriveGame2Selection(match, derived, state.activeModal, isGame2ModalDismissed);

  return (
    <>
      <SessionActiveModals state={state} handlers={handlers} match={match} />

      <SetSummaryModal
        isOpen={setSummaryModalState.isOpen} onClose={onCloseSetSummary}
        timelinePoints={derived.timelinePoints}
        player1Name={match.player1.name} player2Name={match.player2.name}
        initialSetNumber={setSummaryModalState.setNumber}
        completedSetsCount={derived.editScoreCompletedSets?.length ?? 0}
        completedSetsData={derived.editScoreCompletedSets}
        format={match.format as any} isMatchFinished={derived.isFinished}
        onViewReport={onNavigateReport}
        onOpenDoublesArrangement={match.matchType === 'DOUBLES' && match.player1Partner && match.player2Partner ? () => setIsArrangementOpen(true) : undefined}
      />

      {showGame2Modal && (
        <Game2ServerSelectionModal isOpen={true} onClose={() => setIsGame2ModalDismissed(true)}
          teamName={game2TeamName} player1={game2P1} player2={game2P2}
          currentServerId={derived.activeServerId}
          onSelectServer={async (serverId) => {
            if (handlers.changeGameServer) await handlers.changeGameServer(serverId);
            setIsGame2ModalDismissed(true);
          }} />
      )}

      {match.matchType === 'DOUBLES' && match.player1Partner && match.player2Partner && (
        <DoublesArrangementModal
          isOpen={isArrangementOpen} onClose={() => setIsArrangementOpen(false)}
          onConfirm={async (arr) => { if (handlers.updateDoublesArrangement) await handlers.updateDoublesArrangement(arr); }}
          player1={match.player1} player1Partner={match.player1Partner}
          player2={match.player2} player2Partner={match.player2Partner}
          currentArrangement={derived.effectiveScoreState?.doubles}
          currentSetIndex={derived.editScoreCompletedSets?.length ?? 1}
        />
      )}
    </>
  );
}
