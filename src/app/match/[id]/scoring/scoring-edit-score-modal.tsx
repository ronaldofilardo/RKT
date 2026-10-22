import type { TennisFormat } from '@/core/scoring/types';
import { EditScoreModal } from '@/components/scoring/EditScoreModal';
import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageHandlers } from './useScoringPageEffects';
import type { ScoringPageDerived } from './useScoringPageDerived';
import { buildCurrentGamePoints, buildFloorTiebreak } from './scoring-edit-score-modal.logic';

interface ScoringEditScoreModalProps {
  state: ScoringPageState;
  handlers: ScoringPageHandlers;
  derived: ScoringPageDerived;
  match: NonNullable<ScoringPageState['match']>;
  cameFromDashboard: boolean;
  onNavigateDashboard: () => void;
}

export function ScoringEditScoreModal({
  state,
  handlers,
  derived,
  match,
  cameFromDashboard,
  onNavigateDashboard,
}: ScoringEditScoreModalProps) {
  const {
    effectiveScoreState,
    isTiebreak,
    gamePointToDisplay,
    editScoreCurrentSets,
    editScoreCompletedSets,
  } = derived;

  if (state.activeModal !== 'edit-score' || !effectiveScoreState) return null;

  return (
    <EditScoreModal
      isOpen={true}
      matchFormat={match.format as TennisFormat}
      playerNames={{ p1: match.player1.name, p2: match.player2.name }}
      currentSets={editScoreCurrentSets}
      currentServer={effectiveScoreState.server}
      initialServer={match.initialServerId === match.player1.id ? 'player1' : 'player2'}
      completedSets={editScoreCompletedSets}
      currentGamePoints={buildCurrentGamePoints(effectiveScoreState, isTiebreak, gamePointToDisplay)}
      isTiebreak={isTiebreak}
      floorCurrentSets={state.floorCurrentSets ?? editScoreCurrentSets}
      floorTiebreak={buildFloorTiebreak(effectiveScoreState, isTiebreak)}
      suspendedSession={state.suspendedSession}
      onConfirm={handlers.openEditScoreModal}
      onCancel={() => {
        handlers.cancelEditScore();
        if (cameFromDashboard) {
          onNavigateDashboard();
        }
      }}
      onMatchFinished={(_winner) => {
        // Não redirecionar automaticamente - usuário vê o banner e decide quando navegar
      }}
      onRefreshFloor={handlers.refreshEditScoreFloor}
      doubles={
        match.matchType === 'DOUBLES'
          ? {
              player1PartnerName: match.player1Partner?.name,
              player2PartnerName: match.player2Partner?.name,
            }
          : undefined
      }
    />
  );
}
