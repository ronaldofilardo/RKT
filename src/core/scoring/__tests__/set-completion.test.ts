import { completeSet, completeSetWithTiebreak, isSetComplete } from '../set-completion';
import type { ScoringState, ScoringEngineConfig, SetScore } from '../types';

function createBaseState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
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

describe('completeSet', () => {
  it('deve incrementar setsWon do vencedor', () => {
    const state = createBaseState();
    const config = createConfig();
    const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.setsWon.player1).toBe(1);
    expect(result.setsWon.player2).toBe(0);
  });

  it('deve finalizar partida quando player1 atinge setsToWin', () => {
    const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
    const config = createConfig();
    const sets = [{ player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null }];

    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve finalizar partida quando player2 atinge setsToWin', () => {
    const state = createBaseState({ setsWon: { player1: 0, player2: 1 } });
    const config = createConfig();
    const sets = [{ player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null }];

    const result = completeSet('player2', sets[0], sets, 'player1', state, config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player2');
  });

  it('NÃO deve finalizar quando ninguém atingiu setsToWin', () => {
    const state = createBaseState();
    const config = createConfig();
    const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.isFinished).toBe(false);
    expect(result.winner).toBeNull();
  });

  it('deve resetar currentGame para próximo set', () => {
    const state = createBaseState({
      currentGame: { player1: 3, player2: 2, isDeuce: false, advantage: null, secondServe: false },
    });
    const config = createConfig();
    const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
  });

  it('deve alternar servidor', () => {
    const state = createBaseState({ server: 'player1' });
    const config = createConfig();
    const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.server).toBe('player2');
  });

  describe('BEST_OF_3_MATCH_TB / BEST_OF_3_NO_AD / SHORT_SET_2V2_NO_AD', () => {
    it('deve finalizar quando player1 atinge 2 sets', () => {
      const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
      const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
      const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('deve finalizar quando player2 atinge 2 sets', () => {
      const state = createBaseState({ setsWon: { player1: 0, player2: 1 } });
      const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
      const sets = [{ player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null }];

      const result = completeSet('player2', sets[0], sets, 'player1', state, config);
      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('player2');
    });

    it('deve criar match tiebreak set quando empate 1-1', () => {
      const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
      const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
      const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      // player1 já tinha 1 set, agora ganhou outro → 2-0, finaliza
      expect(result.isFinished).toBe(true);
    });

    it('deve criar tiebreak set quando_setsWon fica 1-1', () => {
      const state = createBaseState({ setsWon: { player1: 0, player2: 1 } });
      const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
      const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(false);
      expect(result.sets).toHaveLength(2);
      expect(result.sets[1].isTiebreak).toBe(true);
      expect(result.sets[1].tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });
  });

  describe('BEST_OF_5', () => {
    it('deve finalizar quando player1 atinge 3 sets', () => {
      const state = createBaseState({ setsWon: { player1: 2, player2: 1 } });
      const config = createConfig({ format: 'BEST_OF_5' });
      const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('NÃO deve finalizar quando player1 tem apenas 2 sets em BEST_OF_5', () => {
      const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
      const config = createConfig({ format: 'BEST_OF_5' });
      const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];

      const result = completeSet('player1', sets[0], sets, 'player2', state, config);
      expect(result.isFinished).toBe(false);
    });
  });
});

describe('completeSetWithTiebreak', () => {
  it('deve incrementar games do vencedor no set', () => {
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 6 } }],
    });
    const config = createConfig();
    const tbScore = { player1: 6, player2: 8 };

    const result = completeSetWithTiebreak('player2', tbScore, 'player1', state, config);
    expect(result.sets[0].player2).toBe(7);
    expect(result.sets[0].player1).toBe(6);
    expect(result.sets[0].tiebreakScore).toEqual(tbScore);
    expect(result.sets[0].isTiebreak).toBe(false);
  });

  it('deve chamar completeSet internamente', () => {
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 6, player2: 5 } }],
    });
    const config = createConfig();
    const tbScore = { player1: 8, player2: 6 };

    const result = completeSetWithTiebreak('player1', tbScore, 'player2', state, config);
    expect(result.setsWon.player1).toBe(1);
  });

  it('deve finalizar partida quando setsToWin é atingido via tiebreak', () => {
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 5 } }],
      setsWon: { player1: 1, player2: 0 },
    });
    const config = createConfig();
    const tbScore = { player1: 7, player2: 5 };

    const result = completeSetWithTiebreak('player1', tbScore, 'player2', state, config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });
});

describe('isSetComplete', () => {
  it('deve retornar true quando diff >= 2 e maxGames >= 6 (BEST_OF_3)', () => {
    const set: SetScore = { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null };
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });

  it('deve retornar false quando diff < 2', () => {
    const set: SetScore = { player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null };
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar false quando maxGames < 6', () => {
    const set: SetScore = { player1: 4, player2: 2, isTiebreak: false, tiebreakScore: null };
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar true para set de tiebreak quando TB válido', () => {
    const set: SetScore = {
      player1: 7,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 7, player2: 5 },
    };
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });

  it('deve retornar false para set de tiebreak quando TB ainda em andamento', () => {
    const set: SetScore = {
      player1: 6,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 5, player2: 4 },
    };
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar true para match tiebreak (10+) em MATCH_TB_10', () => {
    const set: SetScore = {
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 7 },
    };
    const config = createConfig({ format: 'MATCH_TB_10' });
    const sets = [set];
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, sets)).toBe(true);
  });

  it('deve retornar false para match tiebreak quando diff < 2', () => {
    const set: SetScore = {
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 9 },
    };
    const config = createConfig({ format: 'MATCH_TB_10' });
    const sets = [set];
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, sets)).toBe(false);
  });

  it('deve usar tbMin=10 para match tiebreak no 5º set de BEST_OF_5', () => {
    const set: SetScore = {
      player1: 6,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 8 },
    };
    const config = createConfig({ format: 'BEST_OF_5' });
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      set,
    ];
    expect(isSetComplete(set, { player1: 2, player2: 2 }, config, sets)).toBe(true);
  });

  describe('No-Ad format', () => {
    it('deve retornar true para SHORT_SET_2V2_NO_AD com 4+ games e diff >= 2', () => {
      const set: SetScore = { player1: 4, player2: 2, isTiebreak: false, tiebreakScore: null };
      const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
    });

    it('deve retornar false para SHORT_SET_2V2_NO_AD com diff < 2', () => {
      const set: SetScore = { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null };
      const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
    });

    it('deve retornar true para BEST_OF_3_NO_AD com 6+ games e diff >= 2', () => {
      const set: SetScore = { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null };
      const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
    });
  });

  describe('PRO_SET_8', () => {
    it('deve retornar true quando maxGames >= 8 e diff >= 2', () => {
      const set: SetScore = { player1: 8, player2: 6, isTiebreak: false, tiebreakScore: null };
      const config = createConfig({ format: 'PRO_SET_8' });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
    });

    it('deve retornar false quando maxGames < 8', () => {
      const set: SetScore = { player1: 7, player2: 5, isTiebreak: false, tiebreakScore: null };
      const config = createConfig({ format: 'PRO_SET_8' });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
    });

    it('deve retornar false quando diff < 2 mesmo com 8 games', () => {
      const set: SetScore = { player1: 8, player2: 7, isTiebreak: false, tiebreakScore: null };
      const config = createConfig({ format: 'PRO_SET_8' });
      expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
    });
  });
});
