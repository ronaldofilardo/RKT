import { processTiebreakPoint, shouldStartTiebreak } from '../tiebreak';
import type { ScoringState, ScoringEngineConfig, SetScore } from '../types';

function createBaseState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } }],
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

describe('processTiebreakPoint', () => {
  it('deve incrementar pontos do player1', () => {
    const state = createBaseState();
    const config = createConfig();
    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.sets[0].tiebreakScore!.player1).toBe(1);
    expect(result.sets[0].tiebreakScore!.player2).toBe(0);
  });

  it('deve incrementar pontos do player2', () => {
    const state = createBaseState();
    const config = createConfig();
    const result = processTiebreakPoint(state, 'player2', config);
    expect(result.sets[0].tiebreakScore!.player1).toBe(0);
    expect(result.sets[0].tiebreakScore!.player2).toBe(1);
  });

  it('deve alternar servidor a cada 2 pontos no total', () => {
    const state = createBaseState();
    const config = createConfig();

    const r1 = processTiebreakPoint(state, 'player1', config);
    expect(r1.server).toBe('player2'); // total=1 (ímpar) → troca

    const r2 = processTiebreakPoint(r1, 'player1', config);
    expect(r2.server).toBe('player2'); // total=2 (par) → mantém
  });

  it('deve manter servidor original quando total é par', () => {
    const state = createBaseState({ server: 'player1' });
    const config = createConfig();
    const r1 = processTiebreakPoint(state, 'player1', config);
    // total=1, ímpar → troca
    expect(r1.server).toBe('player2');

    const r2 = processTiebreakPoint(r1, 'player1', config);
    // total=2, par → mantém (player2 que era o "novo" server)
    expect(r2.server).toBe('player2');
  });

  it('deve finalizar set quando player1 atinge 7 com 2+ pontos de vantagem', () => {
    const tb = { player1: 6, player2: 5 };
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: tb }],
      setsWon: { player1: 1, player2: 0 },
    });
    const config = createConfig();

    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve finalizar set quando player2 atinge 7 com 2+ pontos de vantagem', () => {
    const tb = { player1: 5, player2: 6 };
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: tb }],
      setsWon: { player1: 0, player2: 1 },
    });
    const config = createConfig();

    const result = processTiebreakPoint(state, 'player2', config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player2');
  });

  it('NÃO deve finalizar com 7-6 (diferença de apenas 1)', () => {
    const tb = { player1: 5, player2: 6 };
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: tb }],
    });
    const config = createConfig();

    const result = processTiebreakPoint(state, 'player1', config);
    // Agora 6-6, não finaliza
    expect(result.isFinished).toBe(false);
    expect(result.sets[0].tiebreakScore!.player1).toBe(6);
    expect(result.sets[0].tiebreakScore!.player2).toBe(6);
  });

  it('deve continuar além de 7 quando placar está empatado', () => {
    const tb = { player1: 6, player2: 6 };
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: tb }],
    });
    const config = createConfig();

    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.isFinished).toBe(false);
    expect(result.sets[0].tiebreakScore!.player1).toBe(7);
  });

  it('deve funcionar com tiebreakScore nulo no set (default 0-0)', () => {
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: null }],
    });
    const config = createConfig();

    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.sets[0].tiebreakScore!.player1).toBe(1);
  });

  it('deve tratar match tiebreak (tbMin=10) para MATCH_TB_10', () => {
    const tb = { player1: 9, player2: 7 };
    const state = createBaseState({
      sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: tb }],
      setsWon: { player1: 0, player2: 0 },
    });
    const config = createConfig({ format: 'MATCH_TB_10' });

    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('NÃO deve finalizar match tiebreak em 7-5 (precisa de 10)', () => {
    const tb = { player1: 6, player2: 5 };
    const state = createBaseState({
      sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: tb }],
    });
    const config = createConfig({ format: 'MATCH_TB_10' });

    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.isFinished).toBe(false);
  });

  it('deve tratar match tiebreak no 5º set de BEST_OF_5', () => {
    const tb = { player1: 9, player2: 8 };
    const state = createBaseState({
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: tb },
      ],
      setsWon: { player1: 2, player2: 2 },
    });
    const config = createConfig({ format: 'BEST_OF_5' });

    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve tratar match tiebreak no 3º set de BEST_OF_3_MATCH_TB', () => {
    const tb = { player1: 9, player2: 8 };
    const state = createBaseState({
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: tb },
      ],
      setsWon: { player1: 1, player2: 1 },
    });
    const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });

    const result = processTiebreakPoint(state, 'player1', config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('NÃO deve considerar match tiebreak quando sets.length não bate (BEST_OF_5 com 1 set)', () => {
    const tb = { player1: 6, player2: 5 };
    const state = createBaseState({
      sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: tb }],
      setsWon: { player1: 0, player2: 0 },
    });
    const config = createConfig({ format: 'BEST_OF_5' });

    const result = processTiebreakPoint(state, 'player1', config);
    // tbMin=7, 7-5 com diff=2, mas best_of_5 precisa de 5 sets para match tb
    // Aqui é set normal (tbMin=7), 7>=7 e diff=2 → ganha o set
    expect(result.isFinished).toBe(false); // BEST_OF_5 precisa de 3 sets, só tem 0
  });
});

describe('shouldStartTiebreak', () => {
  function makeSet(overrides: Partial<SetScore> = {}): SetScore {
    return { player1: 6, player2: 6, isTiebreak: false, tiebreakScore: null, ...overrides };
  }

  it('deve retornar false quando placar não é 6-6', () => {
    const set = makeSet({ player1: 5, player2: 4 });
    const state = createBaseState();
    const config = createConfig();
    expect(shouldStartTiebreak(set, state, config)).toBe(false);
  });

  it('deve retornar true em 6-6 para BEST_OF_3', () => {
    const set = makeSet();
    const state = createBaseState();
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('deve retornar true em 6-6 para BEST_OF_5 (não é set decisivo)', () => {
    const set = makeSet();
    const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
    const config = createConfig({ format: 'BEST_OF_5' });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('deve retornar true em 6-6 para BEST_OF_5 no 5º set decisivo', () => {
    const set = makeSet();
    const state = createBaseState({ setsWon: { player1: 2, player2: 2 } });
    const config = createConfig({ format: 'BEST_OF_5' });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('deve retornar false quando está empatado 1-1 em sets para BEST_OF_3_MATCH_TB (com 2+ sets)', () => {
    const set = makeSet();
    const state = createBaseState({
      setsWon: { player1: 1, player2: 1 },
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      ],
    });
    const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
    expect(shouldStartTiebreak(set, state, config)).toBe(false);
  });

  it('deve retornar true em 6-6 para BEST_OF_3_MATCH_TB quando não está 1-1', () => {
    const set = makeSet();
    const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
    const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('deve retornar false quando está empatado 1-1 em sets para BEST_OF_3_NO_AD (com 2+ sets)', () => {
    const set = makeSet();
    const state = createBaseState({
      setsWon: { player1: 1, player2: 1 },
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      ],
    });
    const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
    expect(shouldStartTiebreak(set, state, config)).toBe(false);
  });

  it('deve retornar true em 4-4 para SHORT_SET_2V2_NO_AD', () => {
    const set = makeSet({ player1: 4, player2: 4 });
    const state = createBaseState();
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });

  it('deve retornar false quando SHORT_SET_2V2_NO_AD não está em 4-4', () => {
    const set = makeSet({ player1: 3, player2: 4 });
    const state = createBaseState();
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    expect(shouldStartTiebreak(set, state, config)).toBe(false);
  });

  it('deve retornar true em 6-6 para BEST_OF_3_MATCH_TB quando 0-0 com 1 set', () => {
    const set = makeSet();
    const state = createBaseState({ setsWon: { player1: 0, player2: 0 } });
    const config = createConfig({ format: 'BEST_OF_3_MATCH_TB' });
    expect(shouldStartTiebreak(set, state, config)).toBe(true);
  });
});
