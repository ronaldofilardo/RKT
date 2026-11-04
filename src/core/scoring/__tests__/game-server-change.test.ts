import { applyGameServerChange } from '../game-server-change.logic';
import { getServingMemberId } from '../doubles-serving';
import { ScoringEngine } from '../engine';
import type { DoublesConfig, ScoringEngineConfig, ScoringState } from '../types';

describe('src/core/scoring/game-server-change.logic.ts — applyGameServerChange', () => {
  const doublesConfig: DoublesConfig = {
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
  };

  const doublesEngineConfig: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: 'p1_titular',
    player2Id: 'p2_titular',
    initialServerId: 'p1_titular',
    doubles: doublesConfig,
  };

  const singlesEngineConfig: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };

  const createDoublesState = (overrides: Partial<ScoringState> = {}): ScoringState => ({
    sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: 1700000000000,
    secondServe: false,
    doubles: {
      serveOrder: {
        player1: ['p1_titular', 'p1_parceiro'],
        player2: ['p2_titular', 'p2_parceiro'],
      },
      serveIndex: { player1: 0, player2: 0 },
      receiveDeuce: {
        player1: 'p1_titular',
        player2: 'p2_titular',
      },
    },
    ...overrides,
  });

  const createSinglesState = (overrides: Partial<ScoringState> = {}): ScoringState => ({
    sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: 1700000000000,
    secondServe: false,
    ...overrides,
  });

  describe('Simples', () => {
    it('inverte o lado do sacador do game atual', () => {
      const state = createSinglesState();
      applyGameServerChange(state, singlesEngineConfig, 'p2');
      expect(state.server).toBe('player2');
    });

    it('não altera o placar do game', () => {
      const state = createSinglesState();
      applyGameServerChange(state, singlesEngineConfig, 'p2');
      expect(state.currentGame).toEqual({ player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false });
      expect(state.sets).toEqual([{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }]);
    });

    it('reverte para o sacador original sem perda de estado', () => {
      const state = createSinglesState();
      applyGameServerChange(state, singlesEngineConfig, 'p2');
      applyGameServerChange(state, singlesEngineConfig, 'p1');
      expect(state.server).toBe('player1');
    });

    it('lança INVALID_SERVER para atleta fora da partida', () => {
      const state = createSinglesState();
      expect(() => applyGameServerChange(state, singlesEngineConfig, 'intruso')).toThrow('INVALID_SERVER');
      expect(state.server).toBe('player1');
    });

    it('lança MATCH_ALREADY_FINISHED em partida encerrada', () => {
      const state = createSinglesState({ isFinished: true });
      expect(() => applyGameServerChange(state, singlesEngineConfig, 'p2')).toThrow('MATCH_ALREADY_FINISHED');
    });
  });

  describe('Duplas — troca de parceiro (mesma dupla)', () => {
    it('faz o parceiro assumir o saque do game via toggle de serveIndex', () => {
      const state = createDoublesState();
      applyGameServerChange(state, doublesEngineConfig, 'p1_parceiro');
      expect(state.server).toBe('player1');
      expect(getServingMemberId(state, doublesConfig)).toBe('p1_parceiro');
    });

    it('mantém a rotação futura: próximo game da dupla volta ao titular', () => {
      const state = createDoublesState();
      applyGameServerChange(state, doublesEngineConfig, 'p1_parceiro');
      // Fim do game: advanceServeIndex alterna o índice da dupla sacadora
      state.doubles!.serveIndex.player1 = (state.doubles!.serveIndex.player1 ^ 1) as 0 | 1;
      expect(getServingMemberId(state, doublesConfig)).toBe('p1_titular');
    });

    it('aceita trocar para o titular já em atividade sem alterar serveIndex', () => {
      const state = createDoublesState();
      applyGameServerChange(state, doublesEngineConfig, 'p1_titular');
      expect(state.doubles!.serveIndex.player1).toBe(0);
      expect(getServingMemberId(state, doublesConfig)).toBe('p1_titular');
    });
  });

  describe('Duplas — troca de dupla (lado)', () => {
    it('inverte o lado e posiciona o membro escolhido no saque', () => {
      const state = createDoublesState();
      applyGameServerChange(state, doublesEngineConfig, 'p2_parceiro');
      expect(state.server).toBe('player2');
      expect(getServingMemberId(state, doublesConfig)).toBe('p2_parceiro');
    });

    it('não altera o placar nem o histórico ao trocar de dupla', () => {
      const state = createDoublesState();
      applyGameServerChange(state, doublesEngineConfig, 'p2_titular');
      expect(state.currentGame.player1).toBe(1);
      expect(state.sets[0].player1).toBe(1);
    });
  });

  describe('Duplas — validações', () => {
    it('lança INVALID_SERVER para atleta que não é membro', () => {
      const state = createDoublesState();
      expect(() => applyGameServerChange(state, doublesEngineConfig, 'intruso')).toThrow('INVALID_SERVER');
    });

    it('lança MATCH_ALREADY_FINISHED em partida encerrada', () => {
      const state = createDoublesState({ isFinished: true });
      expect(() => applyGameServerChange(state, doublesEngineConfig, 'p2_titular')).toThrow('MATCH_ALREADY_FINISHED');
    });
  });

  describe('Integração com o engine (setGameServer)', () => {
    it('ScoringEngine.setGameServer atualiza o sacador sem tocar no placar', () => {
      const engine = new ScoringEngine(doublesEngineConfig, createDoublesState());
      engine.setGameServer('p2_parceiro');
      expect(engine.getServer()).toBe('player2');
      expect(engine.getServingMemberId()).toBe('p2_parceiro');
      expect(engine.getState().currentGame).toEqual({ player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false });
    });
  });
});
