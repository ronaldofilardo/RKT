/**
 * Kit de testes de engine.flow.characterization.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra o arrange do arquivo original (assercoes 1:1 mantidas nos testes):
 * - createConfig()/createInitialState()/createSetScore(): fixtures de estado;
 * - playRegular()/toDeuce()/playMatchTiebreak()/playTiebreak()/playTiebreakSequence():
 *   sequencias repetidas de pontos (os `for` do original vivem aqui, nunca
 *   nos arquivos .test.*).
 */
import { applyRegularPoint, applyMatchTiebreak, applyTiebreakPoint } from '../engine.flow';
import { createEmptyGame } from '../engine.state';
import type { ScoringEngineConfig, ScoringState, SetScore } from '../types';

export function createConfig(format: ScoringEngineConfig['format']): ScoringEngineConfig {
  return {
    format,
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };
}

export function createInitialState(config: ScoringEngineConfig): ScoringState {
  const server = config.initialServerId === config.player1Id ? 'player1' : 'player2';
  return {
    sets: [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server,
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };
}

export function createSetScore(
  player1: number,
  player2: number,
  isTiebreak = false,
  tiebreakScore?: { player1: number; player2: number }
): SetScore {
  return { player1, player2, isTiebreak, tiebreakScore: tiebreakScore ?? null };
}

/** Estado inicial com sets, setsWon e servidor predefinidos (currentGame zerado). */
export function stateWithSets(
  config: ScoringEngineConfig,
  sets: SetScore[],
  setsWon: { player1: number; player2: number },
  server: 'player1' | 'player2' = 'player1'
): ScoringState {
  const state = createInitialState(config);
  state.sets = sets;
  state.setsWon = setsWon;
  state.server = server;
  state.currentGame = createEmptyGame();
  return state;
}

/** Aplica `count` pontos comuns seguidos de `winner` (applyRegularPoint). */
export function playRegular(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
  count: number
): ScoringState {
  let s = state;
  for (let i = 0; i < count; i++) s = applyRegularPoint(winner, s, config);
  return s;
}

/** Leva o game a 40-40: 3 pontos de cada lado. */
export function toDeuce(state: ScoringState, config: ScoringEngineConfig): ScoringState {
  return playRegular('player2', playRegular('player1', state, config, 3), config, 3);
}

/** Aplica `count` pontos de match tiebreak seguidos de `winner`. */
export function playMatchTiebreak(
  winner: 'player1' | 'player2',
  state: ScoringState,
  count: number
): ScoringState {
  let s = state;
  for (let i = 0; i < count; i++) s = applyMatchTiebreak(winner, s);
  return s;
}

/** Aplica `count` pontos de tiebreak comum seguidos de `winner`. */
export function playTiebreak(
  state: ScoringState,
  winner: 'player1' | 'player2',
  config: ScoringEngineConfig,
  count: number
): ScoringState {
  let s = state;
  for (let i = 0; i < count; i++) s = applyTiebreakPoint(s, winner, config);
  return s;
}

/** Aplica uma sequência intercalada de vencedores (ex.: 7-5 no tiebreak). */
export function playTiebreakSequence(
  state: ScoringState,
  config: ScoringEngineConfig,
  sequence: ('player1' | 'player2')[]
): ScoringState {
  let s = state;
  for (const winner of sequence) s = applyTiebreakPoint(s, winner, config);
  return s;
}
