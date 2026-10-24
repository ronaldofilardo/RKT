import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { getSetsToWin, getInitialGames, createEmptySetForFormat } from './format-rules';
import { DECISIVE_MATCH_TB_FORMATS, getMatchWinner, createMatchTiebreakSet } from './set-completion-rules.logic';

export function completeSet(
  setWinner: 'player1' | 'player2',
  _finalSet: SetScore,
  newSets: SetScore[],
  newServer: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const setsWon = {
    ...state.setsWon,
    [setWinner]: state.setsWon[setWinner] + 1,
  };

  const setsToWin = DECISIVE_MATCH_TB_FORMATS.has(config.format) ? 2 : getSetsToWin(config);
  const matchWinner = getMatchWinner(setsWon, setsToWin);

  state.sets = newSets;
  state.setsWon = setsWon;
  state.server = newServer;

  if (matchWinner) {
    state.isFinished = true;
    state.winner = matchWinner;
    // Partida encerrada: não existe game em andamento. Sem isso o último game
    // (ex.: 40-15) ficava "preso" no placar da partida finalizada.
    state.currentGame = createEmptyGame();
    return state;
  }

  if (DECISIVE_MATCH_TB_FORMATS.has(config.format) && setsWon.player1 === 1 && setsWon.player2 === 1) {
    newSets.push(createMatchTiebreakSet());
  } else if (getInitialGames(config.format) > 0) {
    // Formatos com placar inicial (Sets Curtos 2/2): o próximo set já nasce
    // com o placar inicial (2-2), mantendo a invariante "último item de
    // sets[] = set em andamento" (timeline e scoreboard dependem dela).
    newSets.push(createEmptySetForFormat(config.format));
  }

  state.currentGame = createEmptyGame();
  return state;
}

export function completeSetWithTiebreak(
  setWinner: 'player1' | 'player2',
  tbScore: { player1: number; player2: number },
  newServer: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const newSet: SetScore = {
    ...currentSet,
    player1: setWinner === 'player1' ? currentSet.player1 + 1 : currentSet.player1,
    player2: setWinner === 'player2' ? currentSet.player2 + 1 : currentSet.player2,
    isTiebreak: false,
    tiebreakScore: tbScore,
  };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = newSet;
  return completeSet(setWinner, newSet, newSets, newServer, state, config);
}
