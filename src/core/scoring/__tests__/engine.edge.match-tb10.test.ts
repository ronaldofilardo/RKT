/**
 * Split de engine-edge-cases.test.ts — describe "ScoringEngine - MATCH_TB_10":
 * tiebreak até 10 pontos, margem 2 e alternância de sacador. Asserções 1:1.
 */
import { ScoringEngine } from '../engine';
import { makeConfig, makePoint, serversAfter, winPoints } from './engineEdgeTestKit';

describe('ScoringEngine - MATCH_TB_10', () => {
  it('deve processar tiebreak de partida até 10 pontos', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));
    winPoints(engine, 'player-1-id', 10);
    const state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon.player1).toBe(1);
  });

  it('deve continuar tiebreak se diferença < 2 em 9-10', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));
    winPoints(engine, 'player-1-id', 9);
    winPoints(engine, 'player-2-id', 10);
    expect(engine.getState().isFinished).toBe(false);
    makePoint(engine, 'player-2-id');
    expect(engine.getState().isFinished).toBe(true);
    expect(engine.getState().winner).toBe('player2');
  });

  it('deve completar tiebreak com player2 vencendo', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));
    winPoints(engine, 'player-2-id', 10);
    const state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player2');
    expect(state.setsWon.player2).toBe(1);
  });

  it('deve alternar servidor a cada 2 pontos no match tiebreak', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));
    expect(engine.getState().server).toBe('player1');
    winPoints(engine, 'player-1-id', 2);
    expect(engine.getState().server).toBe('player2');
  });

  it('deve trocar sacador na soma ímpar dos pontos no tiebreak (0-1, 1-2, 2-3...)', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));
    makePoint(engine, 'player-1-id'); // soma 1 (ímpar) → troca
    expect(engine.getState().server).toBe('player2');
    makePoint(engine, 'player-1-id'); // soma 2 (par) → mantém
    expect(engine.getState().server).toBe('player2');
    makePoint(engine, 'player-2-id'); // soma 3 (ímpar) → troca
    expect(engine.getState().server).toBe('player1');
    makePoint(engine, 'player-2-id'); // soma 4 (par) → mantém
    expect(engine.getState().server).toBe('player1');
    makePoint(engine, 'player-1-id'); // soma 5 (ímpar) → troca
    expect(engine.getState().server).toBe('player2');
  });

  it('deve trocar sacador corretamente em sequência de pontos no tiebreak', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));
    const expectedServers = [
      { total: 0, server: 'player1' }, // inicial
      { total: 1, server: 'player2' }, // após ponto 1
      { total: 2, server: 'player2' }, // após ponto 2
      { total: 3, server: 'player1' }, // após ponto 3
      { total: 4, server: 'player1' }, // após ponto 4
      { total: 5, server: 'player2' }, // após ponto 5
      { total: 6, server: 'player2' }, // após ponto 6
    ];
    expect(engine.getState().server).toBe(expectedServers[0].server);
    const winners = ['player-1-id', 'player-2-id', 'player-1-id', 'player-2-id', 'player-1-id', 'player-2-id'];
    expect(serversAfter(engine, winners)).toEqual(expectedServers.slice(1).map((e) => e.server));
  });
});
