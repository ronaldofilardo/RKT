import type { ScoringPageState } from './useScoringPageState';
import type { ScoringPageDerived } from './useScoringPageDerived';

type Match = NonNullable<ScoringPageState['match']>;

/**
 * Deriva quando o modal de sacador do 2º game (duplas) deve aparecer e quem
 * compõe cada equipe — lógica pura, sem efeitos.
 * Suporta 1º, 2º e 3º sets (inclusive BEST_OF_3_MATCH_TB), mas não repete
 * quando o formato é MATCH_TB_10 (MTB como modo único de jogo).
 */
export function deriveGame2Selection(
  match: Match,
  derived: ScoringPageDerived,
  activeModal: ScoringPageState['activeModal'],
  isDismissed: boolean,
) {
  const isDoubles = match.matchType === 'DOUBLES' && Boolean(match.player1Partner && match.player2Partner);
  const scoreState = derived.effectiveScoreState;
  const sets = scoreState?.sets ?? [];
  const currentSetIndex = Math.max(0, sets.length - 1);
  const currentSet = sets[currentSetIndex];
  const completedGamesInSet = currentSet ? currentSet.player1 + currentSet.player2 : 0;

  const isStandaloneMtb = match.format === 'MATCH_TB_10';
  const isMtbDecisiveSet = match.format === 'BEST_OF_3_MATCH_TB' && currentSetIndex === 2;
  const isGame2Threshold = isMtbDecisiveSet ? completedGamesInSet === 0 : completedGamesInSet === 1;

  const isGame2Start = Boolean(
    isDoubles &&
    !isStandaloneMtb &&
    isGame2Threshold &&
    scoreState?.currentGame &&
    scoreState.currentGame.player1 === 0 &&
    scoreState.currentGame.player2 === 0 &&
    !scoreState.currentGame.secondServe &&
    !derived.isFinished &&
    activeModal === null
  );

  const servingSide = scoreState?.server ?? 'player2';
  return {
    showGame2Modal: isGame2Start && !isDismissed,
    currentSetIndex,
    isMtbDecisiveSet,
    teamName: servingSide === 'player1' ? 'Dupla 1' : 'Dupla 2',
    player1: servingSide === 'player1' ? match.player1 : match.player2,
    player2: servingSide === 'player1' ? match.player1Partner! : match.player2Partner!,
  };
}
