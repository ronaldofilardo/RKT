import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageDerived } from './useScoringPageDerived';

type Match = NonNullable<ScoringPageState['match']>;

/**
 * Deriva quando o modal de sacador do 2º game (duplas) deve aparecer e quem
 * compõe cada equipe — lógica pura, sem efeitos.
 */
export function deriveGame2Selection(
  match: Match,
  derived: ScoringPageDerived,
  activeModal: ScoringPageState['activeModal'],
  isDismissed: boolean,
) {
  const isDoubles = match.matchType === 'DOUBLES' && Boolean(match.player1Partner && match.player2Partner);
  const currentSet = derived.effectiveScoreState?.sets?.[0];
  const completedGamesSet1 = currentSet ? currentSet.player1 + currentSet.player2 : 0;
  const isGame2Start = Boolean(
    isDoubles &&
    completedGamesSet1 === 1 &&
    derived.effectiveScoreState?.currentGame &&
    derived.effectiveScoreState.currentGame.player1 === 0 &&
    derived.effectiveScoreState.currentGame.player2 === 0 &&
    !derived.effectiveScoreState.currentGame.secondServe &&
    !derived.isFinished &&
    activeModal === null
  );

  const servingSide = derived.effectiveScoreState?.server ?? 'player2';
  return {
    showGame2Modal: isGame2Start && !isDismissed,
    teamName: servingSide === 'player1' ? 'Dupla 1' : 'Dupla 2',
    player1: servingSide === 'player1' ? match.player1 : match.player2,
    player2: servingSide === 'player1' ? match.player1Partner! : match.player2Partner!,
  };
}
