import type { ScoringEngineConfig, ScoringState, GameScore } from './types';
import { createEmptyGame, completeSet, getInitialGames, usesNoAd, incrementGame, processNoAdPoint, processStandardGamePoint, getCurrentSet, resetOverscoredSet, applyGameWinner, replaceCurrentSet, startTiebreakState, startMatchTiebreakState, isFinalSetTiebreakTrigger, isNewTiebreak, isNewMatchTiebreak, isSetComplete } from './game-processing.helpers';

function processStandardPoint(winner: 'player1' | 'player2', state: ScoringState, config: ScoringEngineConfig): ScoringState {
  const game = incrementGame(winner, { ...state.currentGame });
  const processWon = (gameWinner: 'player1' | 'player2', finalGame: GameScore, current: ScoringState, rules: ScoringEngineConfig) => handleGameWon(gameWinner, finalGame, current, rules);
  return usesNoAd(config) ? processNoAdPoint(winner, game, state, config, processWon) : processStandardGamePoint(winner, game, state, config, processWon);
}

function processDeucePoint(winner: 'player1' | 'player2', state: ScoringState, config: ScoringEngineConfig): ScoringState {
  const game = { ...state.currentGame };
  if (game.advantage === null) game.advantage = winner;
  else if (game.advantage === winner) return handleGameWon(winner, game, state, config);
  else game.advantage = null;
  return { ...state, currentGame: game };
}

export function processRegularPoint(winner: 'player1' | 'player2', state: ScoringState, config: ScoringEngineConfig): ScoringState {
  return state.currentGame.isDeuce ? processDeucePoint(winner, state, config) : processStandardPoint(winner, state, config);
}

export function handleGameWon(gameWinner: 'player1' | 'player2', _finalGame: GameScore, state: ScoringState, config: ScoringEngineConfig): ScoringState {
  const { index, set: rawSet } = getCurrentSet(state, config);
  const currentSet = resetOverscoredSet(rawSet, state, config);
  const newSet = applyGameWinner({ ...currentSet }, gameWinner);
  const newSets = replaceCurrentSet(state.sets, index, currentSet, newSet, getInitialGames(config.format));
  const newServer = state.server === 'player1' ? 'player2' : 'player1';

  if (isFinalSetTiebreakTrigger(state, newSet, config)) return startTiebreakState(state, newSets, newSets.length - 1, newSet, newServer);
  if (isNewMatchTiebreak(state, config)) return startMatchTiebreakState(state, newSets, newServer);
  if (isNewTiebreak(newSet, state, config)) return startTiebreakState(state, newSets, newSets.length - 1, newSet, newServer);
  if (isSetComplete(newSet, state.setsWon, config, state.sets)) return completeSet(gameWinner, newSet, newSets, newServer, state, config);

  state.sets = newSets;
  state.currentGame = createEmptyGame();
  state.server = newServer;
  return state;
}
