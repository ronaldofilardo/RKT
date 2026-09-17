import { processRegularPoint, handleGameWon } from '../game-processing';
import type { ScoringState, ScoringEngineConfig, GameScore } from '../types';

function createBaseState(overrides: Partial<ScoringState> = {}): ScoringState {
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

function createConfig(overrides: Partial<ScoringEngineConfig> = {}): ScoringEngineConfig {
  return {
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
    ...overrides,
  };
}

function createGame(overrides: Partial<GameScore> = {}): GameScore {
  return { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false, ...overrides };
}

describe('processRegularPoint', () => {
  describe('standard scoring (BEST_OF_3)', () => {
    it('deve incrementar pontos do player1', () => {
      const state = createBaseState();
      const config = createConfig();
      const result = processRegularPoint('player1', state, config);
      expect(result.currentGame.player1).toBe(1);
      expect(result.currentGame.player2).toBe(0);
    });

    it('deve incrementar pontos do player2', () => {
      const state = createBaseState();
      const config = createConfig();
      const result = processRegularPoint('player2', state, config);
      expect(result.currentGame.player1).toBe(0);
      expect(result.currentGame.player2).toBe(1);
    });

    it('deve progredir corretamente 0->1->2->3 (0-15-30-40)', () => {
      let state = createBaseState();
      const config = createConfig();

      state = processRegularPoint('player1', state, config);
      expect(state.currentGame.player1).toBe(1);

      state = processRegularPoint('player1', state, config);
      expect(state.currentGame.player1).toBe(2);

      state = processRegularPoint('player1', state, config);
      expect(state.currentGame.player1).toBe(3);
    });

    it('deve ativar deuce quando 3-3', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 2, player2: 3 }),
      });
      const config = createConfig();

      const result = processRegularPoint('player1', state, config);
      expect(result.currentGame.isDeuce).toBe(true);
      expect(result.currentGame.player1).toBe(3);
      expect(result.currentGame.player2).toBe(3);
    });

    it('deve vencer game quando player1 atinge 4 pontos com player2 < 3', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 1 }),
      });
      const config = createConfig();

      const result = processRegularPoint('player1', state, config);
      expect(result.currentGame.player1).toBe(0);
      expect(result.currentGame.player2).toBe(0);
      expect(result.sets).toHaveLength(1);
      expect(result.sets[0].player1).toBe(1);
    });

    it('deve vencer game quando player2 atinge 4 pontos com player1 < 3', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 1, player2: 3 }),
      });
      const config = createConfig();

      const result = processRegularPoint('player2', state, config);
      expect(result.currentGame.player1).toBe(0);
      expect(result.currentGame.player2).toBe(0);
      expect(result.sets).toHaveLength(1);
      expect(result.sets[0].player2).toBe(1);
    });

    it('deve alternar servidor após game', () => {
      const state = createBaseState({
        server: 'player1',
        currentGame: createGame({ player1: 3, player2: 1 }),
      });
      const config = createConfig();

      const result = processRegularPoint('player1', state, config);
      expect(result.server).toBe('player2');
    });
  });

  describe('deuce scoring', () => {
    it('deve dar vantagem ao player1 no deuce', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
      });
      const config = createConfig();

      const result = processRegularPoint('player1', state, config);
      expect(result.currentGame.advantage).toBe('player1');
    });

    it('deve voltar ao deuce quando player1 com vantagem perde ponto', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true, advantage: 'player1' }),
      });
      const config = createConfig();

      const result = processRegularPoint('player2', state, config);
      expect(result.currentGame.advantage).toBeNull();
      expect(result.currentGame.isDeuce).toBe(true);
    });

    it('deve vencer game quando player1 com vantagem vence próximo ponto', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true, advantage: 'player1' }),
      });
      const config = createConfig();

      const result = processRegularPoint('player1', state, config);
      expect(result.currentGame.player1).toBe(0);
      expect(result.currentGame.player2).toBe(0);
      expect(result.sets).toHaveLength(1);
      expect(result.sets[0].player1).toBe(1);
    });

    it('deve dar vantagem ao player2 no deuce', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
      });
      const config = createConfig();

      const result = processRegularPoint('player2', state, config);
      expect(result.currentGame.advantage).toBe('player2');
    });

    it('deve vencer game quando player2 com vantagem vence próximo ponto', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true, advantage: 'player2' }),
      });
      const config = createConfig();

      const result = processRegularPoint('player2', state, config);
      expect(result.sets).toHaveLength(1);
      expect(result.sets[0].player2).toBe(1);
    });

    it('deve manter deuce após múltiplos alternâncias', () => {
      let state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
      });
      const config = createConfig();

      state = processRegularPoint('player1', state, config);
      expect(state.currentGame.advantage).toBe('player1');

      state = processRegularPoint('player2', state, config);
      expect(state.currentGame.advantage).toBeNull();
      expect(state.currentGame.isDeuce).toBe(true);

      state = processRegularPoint('player2', state, config);
      expect(state.currentGame.advantage).toBe('player2');

      state = processRegularPoint('player1', state, config);
      expect(state.currentGame.advantage).toBeNull();
      expect(state.currentGame.isDeuce).toBe(true);
    });
  });

  describe('No-Ad scoring', () => {
    it('deve marcar deuce quando 3-3 em formato No-Ad', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 2, player2: 3 }),
      });
      const config = createConfig({ format: 'BEST_OF_3_NO_AD' });

      const result = processRegularPoint('player1', state, config);
      expect(result.currentGame.isDeuce).toBe(true);
      expect(result.currentGame.player1).toBe(3);
      expect(result.currentGame.player2).toBe(3);
    });

    it('deve vencer game no ponto decisivo (sudden death) em No-Ad', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
      });
      const config = createConfig({ format: 'BEST_OF_3_NO_AD' });

      const result = processRegularPoint('player1', state, config);
      expect(result.sets).toHaveLength(1);
      expect(result.sets[0].player1).toBe(1);
      expect(result.currentGame.player1).toBe(0);
    });

    it('deve vencer game quando player2 vence ponto decisivo No-Ad', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
      });
      const config = createConfig({ format: 'BEST_OF_3_NO_AD' });

      const result = processRegularPoint('player2', state, config);
      expect(result.sets).toHaveLength(1);
      expect(result.sets[0].player2).toBe(1);
    });

    it('deve vencer game com 4 pontos em No-Ad (sem deuce)', () => {
      const state = createBaseState({
        currentGame: createGame({ player1: 3, player2: 0 }),
      });
      const config = createConfig({ format: 'BEST_OF_3_NO_AD' });

      const result = processRegularPoint('player1', state, config);
      expect(result.sets).toHaveLength(1);
      expect(result.sets[0].player1).toBe(1);
    });
  });
});

describe('handleGameWon', () => {
  it('deve incrementar games do vencedor no set atual', () => {
    const state = createBaseState({
      sets: [{ player1: 2, player2: 3, isTiebreak: false, tiebreakScore: null }],
    });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 1 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.sets[0].player1).toBe(3);
  });

  it('deve resetar currentGame', () => {
    const state = createBaseState({
      sets: [{ player1: 2, player2: 3, isTiebreak: false, tiebreakScore: null }],
    });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 1 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
    expect(result.currentGame.isDeuce).toBe(false);
    expect(result.currentGame.advantage).toBeNull();
  });

  it('deve alternar servidor', () => {
    const state = createBaseState({
      server: 'player1',
      sets: [{ player1: 2, player2: 3, isTiebreak: false, tiebreakScore: null }],
    });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 1 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.server).toBe('player2');
  });

  it('deve finalizar set quando player1 atinge 6 games com diff >= 2', () => {
    const state = createBaseState({
      sets: [{ player1: 5, player2: 3, isTiebreak: false, tiebreakScore: null }],
    });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 1 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.setsWon.player1).toBe(1);
  });

  it('deve iniciar tiebreak em 6-6', () => {
    const state = createBaseState({
      sets: [{ player1: 5, player2: 6, isTiebreak: false, tiebreakScore: null }],
    });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 2 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.sets[0].isTiebreak).toBe(true);
    expect(result.sets[0].tiebreakScore).toEqual({ player1: 0, player2: 0 });
  });

  it('deve finalizar partida quando setsToWin é atingido', () => {
    const state = createBaseState({
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 5, player2: 3, isTiebreak: false, tiebreakScore: null },
      ],
      setsWon: { player1: 1, player2: 0 },
    });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 1 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve lançar erro para gameWinner inválido', () => {
    const state = createBaseState({
      sets: [{ player1: 2, player2: 3, isTiebreak: false, tiebreakScore: null }],
    });
    const config = createConfig();
    const game = createGame();

    expect(() => {
      handleGameWon('invalid' as any, game, state, config);
    }).toThrow('INVALID_GAME_WINNER');
  });

  it('deve criar novo set quando set atual já está completo', () => {
    const state = createBaseState({
      sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
      setsWon: { player1: 1, player2: 0 },
    });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 2 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.sets.length).toBe(2);
    expect(result.sets[1].player1).toBe(1);
  });

  it('deve criar primeiro set quando sets está vazio', () => {
    const state = createBaseState({ sets: [] });
    const config = createConfig();
    const game = createGame({ player1: 3, player2: 2 });

    const result = handleGameWon('player1', game, state, config);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player1).toBe(1);
  });

  describe('BEST_OF_5', () => {
    it('deve iniciar tiebreak no 5º set quando 2-2 em sets e 6-6 em games', () => {
      const state = createBaseState({
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 5, player2: 6, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 2, player2: 2 },
      });
      const config = createConfig({ format: 'BEST_OF_5' });
      const game = createGame({ player1: 3, player2: 2 });

      const result = handleGameWon('player1', game, state, config);
      const fifthSet = result.sets[4];
      expect(fifthSet.isTiebreak).toBe(true);
      expect(fifthSet.tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });
  });
});
