import { logger } from '@/lib/logger';
import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptySetForFormat, getInitialGames } from './format-rules';
import { shouldStartTiebreak } from './tiebreak';
import { isSetComplete } from './set-completion';
import { createEmptyGame } from './engine.state';

function validateGameWinner(gameWinner: 'player1' | 'player2', currentSet: SetScore): void {
  if (gameWinner !== 'player1' && gameWinner !== 'player2') {
    logger.error('[ScoringEngine] onGameWon: invalid gameWinner', { gameWinner, currentSet });
    throw new Error('INVALID_GAME_WINNER');
  }
}

function resolveActiveSet(state: ScoringState, config: ScoringEngineConfig): {
  currentSet: SetScore;
  currentSetIndex: number;
  /** true quando o set ativo ainda NÃO existe em state.sets (deve ser empilhado). */
  isNewSet: boolean;
} {
  const currentSetIndex = state.sets.length === 0 ? 0 : state.sets.length - 1;
  let currentSet = state.sets[currentSetIndex] ?? createEmptySetForFormat(config.format);

  const initGames = getInitialGames(config.format);
  const setsDecided = state.setsWon.player1 + state.setsWon.player2;
  const lastSetAlreadyDecided = state.sets.length > 0 && setsDecided >= state.sets.length;
  const isPreviousComplete = isSetComplete(currentSet, state.setsWon, config, state.sets) &&
    !currentSet.isTiebreak &&
    (currentSet.player1 > initGames || currentSet.player2 > initGames);

  const isNewSet = state.sets.length === 0 || lastSetAlreadyDecided || isPreviousComplete;

  if (lastSetAlreadyDecided || isPreviousComplete) {
    currentSet = createEmptySetForFormat(config.format);
  }

  return { currentSet, currentSetIndex, isNewSet };
}

function shouldTriggerTiebreak(newSet: SetScore, state: ScoringState, config: ScoringEngineConfig): boolean {
  if (newSet.isTiebreak) return false;

  const isBestOf5Decider = config.format === 'BEST_OF_5' &&
    state.setsWon.player1 === 2 &&
    state.setsWon.player2 === 2 &&
    newSet.player1 === 6 &&
    newSet.player2 === 6;

  return isBestOf5Decider || shouldStartTiebreak(newSet, state, config);
}

function transitionToTiebreak(
  newSet: SetScore,
  newSets: SetScore[],
  state: ScoringState,
  newServer: 'player1' | 'player2',
): ScoringState {
  newSet.isTiebreak = true;
  newSet.tiebreakScore = { player1: 0, player2: 0 };
  newSets[newSets.length - 1] = newSet;

  state.sets = newSets;
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
}

function transitionToMatchTiebreak(
  state: ScoringState,
  newServer: 'player1' | 'player2',
): ScoringState {
  const matchTbSet: SetScore = {
    player1: 0,
    player2: 0,
    isTiebreak: true,
    tiebreakScore: { player1: 0, player2: 0 },
  };
  state.sets = [...state.sets, matchTbSet];
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
}

export { validateGameWinner, resolveActiveSet, shouldTriggerTiebreak, transitionToTiebreak, transitionToMatchTiebreak };
