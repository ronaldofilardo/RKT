/**
 * Kit de testes de engine.characterization.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra o arrange do arquivo original (assercoes 1:1 mantidas nos testes):
 * - createConfig()/makeEngine(): configuracao e engine por formato;
 * - winPoints()/winGame()/winSet60()/winSet64(): sequencias de pontos/games
 *   (os `for`/`if` do original vivem aqui, nunca nos arquivos .test.*);
 * - toDeuce()/reachTiebreak(): cenarios 40-40 e 6-6.
 * Os timestamps reproduzem os offsets do original (Date.now() + tsBase + i).
 */
import { ScoringEngine } from '../engine';
import type { ScoringEngineConfig, ScoringState } from '../types';

/** ScoringState vazio com defaults neutros; `overrides` é aplicado por último. */
export function scoringState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
    ...overrides,
  };
}

export function createConfig(format: ScoringEngineConfig['format']): ScoringEngineConfig {
  return {
    format,
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };
}

/** Engine nova no formato dado (default BEST_OF_3, servidor p1). */
export function makeEngine(format: ScoringEngineConfig['format'] = 'BEST_OF_3'): ScoringEngine {
  return new ScoringEngine(createConfig(format));
}

/** Aplica `count` pontos WINNER seguidos de `winnerId` (offset de timestamp = tsBase + i). */
export function winPoints(engine: ScoringEngine, winnerId: string, count: number, tsBase = 0): void {
  for (let i = 0; i < count; i++) {
    engine.applyPoint({ type: 'WINNER', winnerId, timestamp: Date.now() + tsBase + i });
  }
}

/** Ganha um game com 4 pontos seguidos (4-0). */
export function winGame(engine: ScoringEngine, winnerId: string, tsBase = 0): void {
  winPoints(engine, winnerId, 4, tsBase);
}

/** Ganha um set 6-0 (6 games de 4 pontos). */
export function winSet60(engine: ScoringEngine, winnerId: string, tsBase = 0): void {
  for (let game = 0; game < 6; game++) {
    winPoints(engine, winnerId, 4, tsBase);
  }
}

/**
 * Cenario do teste "completes set at 6-4": p1 vence 6 games (4 pontos cada);
 * p2 vence 4 games nos 4 primeiros (o 5o e 6o game sao 4-0 para p1).
 * Timestamps: p1 tsBase 0, p2 tsBase 100 (igual ao original).
 */
export function winSet64(engine: ScoringEngine): void {
  for (let game = 0; game < 6; game++) {
    winPoints(engine, 'p1', 4, 0);
    if (game < 4) {
      winPoints(engine, 'p2', 4, 100);
    }
  }
}

/** Leva o game a 40-40 (3 pontos de cada lado). */
export function toDeuce(engine: ScoringEngine): void {
  winPoints(engine, 'p1', 3, 0);
  winPoints(engine, 'p2', 3, 10);
}

/** Seta o placar de games em 6-6 (inicia tiebreak). */
export function reachTiebreak(engine: ScoringEngine): void {
  for (let game = 0; game < 6; game++) {
    winPoints(engine, 'p1', 4, 0);
    winPoints(engine, 'p2', 4, 100);
  }
}
