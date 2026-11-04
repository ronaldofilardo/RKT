import { ScoringEngine } from '../engine';
import type { ScoringEngineConfig } from '../types';

describe('engine-from-serialized — correção de sacador inicial cônscia de duplas (regressão)', () => {
  const doublesConfig: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: 'p1_titular',
    player2Id: 'p2_titular',
    initialServerId: 'p2_parceiro',
    doubles: {
      members: {
        player1: ['p1_titular', 'p1_parceiro'],
        player2: ['p2_titular', 'p2_parceiro'],
      },
      initial: {
        serveOrder: {
          player1: ['p1_titular', 'p1_parceiro'],
          player2: ['p2_titular', 'p2_parceiro'],
        },
        receiveDeuce: {
          player1: 'p1_titular',
          player2: 'p2_titular',
        },
      },
    },
  };

  const virginState = {
    sets: [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1' as const,
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };

  it('estado virgem com initialServerId de parceiro da dupla 2 resolve player2 (não player1)', () => {
    const serialized = JSON.stringify({ state: virginState, history: [] });
    const engine = ScoringEngine.fromSerialized(doublesConfig, serialized);
    expect(engine.getServer()).toBe('player2');
  });

  it('game 1 com initialServerId de parceiro da dupla 2 corrige state.server divergente para player2', () => {
    const state = {
      ...virginState,
      sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 15, isDeuce: false, advantage: null, secondServe: false },
      startedAt: 1700000000000,
    };
    const serialized = JSON.stringify({ state, history: [{ stateBefore: virginState, point: {} }] });
    const engine = ScoringEngine.fromSerialized(doublesConfig, serialized);
    expect(engine.getServer()).toBe('player2');
  });

  it('após o game 1 (games concluídos > 0) a correção automática não sobrescreve uma troca manual', () => {
    const state = {
      ...virginState,
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 15, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      startedAt: 1700000000000,
    };
    // Sacador corrigido manualmente para a dupla 1 no game 2
    const serialized = JSON.stringify({ state, history: [] });
    const engine = ScoringEngine.fromSerialized(doublesConfig, serialized);
    expect(engine.getServer()).toBe('player1');
  });

  it('estado virgem de simples preserva o comportamento legado (initialServerId player2 => player2)', () => {
    const singlesConfig: ScoringEngineConfig = {
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p2',
    };
    const serialized = JSON.stringify({ state: virginState, history: [] });
    const engine = ScoringEngine.fromSerialized(singlesConfig, serialized);
    expect(engine.getServer()).toBe('player2');
  });
});
