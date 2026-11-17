/**
 * Kit de testes de engine-edge-cases.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra o arrange do arquivo original (assercoes 1:1 mantidas nos testes):
 * - makeConfig()/createEngine(): configuracao com ids "player-1-id"/"player-2-id";
 * - makePoint()/winPoints()/winGame()/winGames()/winGamesPair(): sequencias de
 *   pontos e games (os `for` do original vivem aqui, nunca nos .test.*);
 * - serversAfter(): aplica a sequencia e devolve o servidor apos cada ponto
 *   (o unico loop com expect do original).
 */
import { ScoringEngine } from '../engine';
import type { PointFlow } from '../types';

export function makeConfig(format: any, serverId = 'player-1-id') {
  return {
    format,
    player1Id: 'player-1-id',
    player2Id: 'player-2-id',
    initialServerId: serverId,
  };
}

export function createEngine() {
  return new ScoringEngine(makeConfig('BEST_OF_3'));
}

export function makePoint(engine: ScoringEngine, winnerId: string) {
  const state = engine.getState();
  const serverId = state.server === 'player1' ? 'player-1-id' : 'player-2-id';
  return engine.applyPoint({ winnerId, type: 'WINNER', serverId } as PointFlow);
}

/** Aplica `count` pontos WINNER seguidos de `winnerId`. */
export function winPoints(engine: ScoringEngine, winnerId: string, count: number): void {
  for (let i = 0; i < count; i++) makePoint(engine, winnerId);
}

/** Ganha um game com 4 pontos seguidos. */
export function winGame(engine: ScoringEngine, winnerId: string): void {
  winPoints(engine, winnerId, 4);
}

/** Ganha `count` games seguidos do mesmo vencedor. */
export function winGames(engine: ScoringEngine, winnerId: string, count: number): void {
  for (let g = 0; g < count; g++) winGame(engine, winnerId);
}

/** `count` pares de games alternados: p1, p2, p1, p2... */
export function winGamesPair(engine: ScoringEngine, count: number): void {
  for (let g = 0; g < count; g++) {
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');
  }
}

/** Aplica a sequencia e devolve o servidor (player1/player2) apos cada ponto. */
export function serversAfter(engine: ScoringEngine, winners: string[]): string[] {
  return winners.map((winnerId) => {
    makePoint(engine, winnerId);
    return engine.getState().server;
  });
}
