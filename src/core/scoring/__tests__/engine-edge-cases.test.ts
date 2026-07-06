import { ScoringEngine } from '../engine';
import type { PointFlow } from '../types';

function makeConfig(format: any, serverId = 'player-1-id') {
  return {
    format,
    player1Id: 'player-1-id',
    player2Id: 'player-2-id',
    initialServerId: serverId,
  };
}

function createEngine() {
  return new ScoringEngine(makeConfig('BEST_OF_3'));
}

function makePoint(engine: ScoringEngine, winnerId: string) {
  const state = engine.getState();
  const serverId = state.server === 'player1' ? 'player-1-id' : 'player-2-id';
  return engine.applyPoint({ winnerId, type: 'WINNER', serverId } as PointFlow);
}

function winGame(engine: ScoringEngine, winnerId: string) {
  for (let i = 0; i < 4; i++) makePoint(engine, winnerId);
}

function winSet(engine: ScoringEngine, winnerId: string, games: number) {
  const loserId = winnerId === 'player-1-id' ? 'player-2-id' : 'player-1-id';
  for (let g = 0; g < games; g++) {
    winGame(engine, winnerId);
    if (g < games - 1 || engine.getState().isFinished) break;
    winGame(engine, loserId);
    if (engine.getState().isFinished) break;
  }
}

describe('ScoringEngine - MATCH_TB_10', () => {
  it('deve processar tiebreak de partida até 10 pontos', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));

    for (let i = 0; i < 10; i++) makePoint(engine, 'player-1-id');

    const state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon.player1).toBe(1);
  });

  it('deve continuar tiebreak se diferença < 2 em 9-10', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));

    for (let i = 0; i < 9; i++) makePoint(engine, 'player-1-id');
    for (let i = 0; i < 10; i++) makePoint(engine, 'player-2-id');

    expect(engine.getState().isFinished).toBe(false);

    makePoint(engine, 'player-2-id');
    expect(engine.getState().isFinished).toBe(true);
    expect(engine.getState().winner).toBe('player2');
  });

  it('deve completar tiebreak com player2 vencendo', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));

    for (let i = 0; i < 10; i++) makePoint(engine, 'player-2-id');

    const state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player2');
    expect(state.setsWon.player2).toBe(1);
  });

  it('deve alternar servidor a cada 2 pontos no match tiebreak', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));

    expect(engine.getState().server).toBe('player1');
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getState().server).toBe('player2');
  });

  it('deve trocar sacador na soma ímpar dos pontos no tiebreak (0-1, 1-2, 2-3...)', () => {
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'));

    // Ponto 1: soma = 1 (ímpar) → deve trocar para player2
    makePoint(engine, 'player-1-id');
    expect(engine.getState().server).toBe('player2');

    // Ponto 2: soma = 2 (par) → mantém player2
    makePoint(engine, 'player-1-id');
    expect(engine.getState().server).toBe('player2');

    // Ponto 3: soma = 3 (ímpar) → deve trocar para player1
    makePoint(engine, 'player-2-id');
    expect(engine.getState().server).toBe('player1');

    // Ponto 4: soma = 4 (par) → mantém player1
    makePoint(engine, 'player-2-id');
    expect(engine.getState().server).toBe('player1');

    // Ponto 5: soma = 5 (ímpar) → deve trocar para player2
    makePoint(engine, 'player-1-id');
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

    for (let i = 1; i < expectedServers.length; i++) {
      makePoint(engine, i % 2 === 1 ? 'player-1-id' : 'player-2-id');
      expect(engine.getState().server).toBe(expectedServers[i].server);
    }
  });
});

describe('ScoringEngine - PRO_SET_8', () => {
  it('deve vencer set com 8 games e dif 2', () => {
    const engine = new ScoringEngine(makeConfig('PRO_SET_8'));

    for (let g = 0; g < 7; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 6; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');

    const state = engine.getState();
    expect(state.sets[0].player1).toBe(8);
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
  });

  it('deve iniciar tiebreak em 8-8 no PRO_SET_8', () => {
    const engine = new ScoringEngine(makeConfig('PRO_SET_8'));

    for (let g = 0; g < 7; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 7; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');

    expect(engine.getState().sets[0].isTiebreak).toBe(true);
    expect(engine.getState().sets[0].player1).toBe(8);
    expect(engine.getState().sets[0].player2).toBe(8);
  });
});

describe('ScoringEngine - SHORT_SET_2V2_NO_AD', () => {
  it('deve completar game no deuce com NO_AD (3-3 = game win)', () => {
    const engine = new ScoringEngine(makeConfig('SHORT_SET_2V2_NO_AD'));

    for (let i = 0; i < 3; i++) makePoint(engine, 'player-1-id');
    for (let i = 0; i < 2; i++) makePoint(engine, 'player-2-id');

    makePoint(engine, 'player-2-id');
    const state = engine.getState();
    expect(state.sets[0].player2).toBe(1);
  });

  it('deve completar set em 4 games com diff 2 no SHORT_SET', () => {
    const engine = new ScoringEngine(makeConfig('SHORT_SET_2V2_NO_AD'));
    for (let g = 0; g < 4; g++) winGame(engine, 'player-1-id');

    const state = engine.getState();
    expect(state.setsWon.player1).toBe(1);
  });

  it('deve iniciar tiebreak em 4-4 no SHORT_SET_2V2_NO_AD', () => {
    const engine = new ScoringEngine(makeConfig('SHORT_SET_2V2_NO_AD'));

    for (let g = 0; g < 3; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 3; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');

    expect(engine.getState().sets[0].isTiebreak).toBe(true);
  });
});

describe('ScoringEngine - BEST_OF_3_MATCH_TB', () => {
  it('deve iniciar tiebreak no primeiro set em 6-6', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3_MATCH_TB'));

    for (let g = 0; g < 5; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 5; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');

    expect(engine.getState().sets[0].isTiebreak).toBe(true);
  });

  it('deve completar partida com sets 2-0', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3_MATCH_TB'));

    for (let g = 0; g < 5; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 4; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');

    expect(engine.getState().setsWon.player1).toBe(1);
    expect(engine.getState().isFinished).toBe(false);

    for (let g = 0; g < 5; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 4; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');

    expect(engine.getState().isFinished).toBe(true);
    expect(engine.getState().winner).toBe('player1');
  });

  it('deve não iniciar tiebreak no set decisivo (1-1) em 6-6', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3_MATCH_TB'));

    for (let g = 0; g < 6; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 6; g++) winGame(engine, 'player-2-id');

    expect(engine.getState().setsWon.player1).toBe(1);
    expect(engine.getState().setsWon.player2).toBe(1);

    for (let g = 0; g < 6; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 6; g++) winGame(engine, 'player-2-id');

    expect(engine.getState().isFinished).toBe(false);
    expect(engine.getState().sets[2]?.isTiebreak).toBeFalsy();
  });
});

describe('ScoringEngine - undoLastPoint advanced', () => {
  it('deve retornar null se não há histórico', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    expect(engine.undoLastPoint()).toBeNull();
  });

  it('deve restaurar estado após múltiplos undos', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-2-id');

    expect(engine.getHistoryLength()).toBe(3);

    engine.undoLastPoint();
    expect(engine.getState().currentGame.player2).toBe(0);

    engine.undoLastPoint();
    expect(engine.getState().currentGame.player1).toBe(1);

    engine.undoLastPoint();
    expect(engine.getState().currentGame.player1).toBe(0);
    expect(engine.getHistoryLength()).toBe(0);
  });
});

describe('ScoringEngine - replayCurrentPoint', () => {
  it('deve ser no-op se não há histórico', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    engine.replayCurrentPoint();
    expect(engine.getHistoryLength()).toBe(0);
  });

  it('deve restaurar estado anterior e remover último entry', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');

    expect(engine.getHistoryLength()).toBe(2);
    expect(engine.getState().currentGame.player1).toBe(2);

    engine.replayCurrentPoint();
    expect(engine.getHistoryLength()).toBe(1);
    expect(engine.getState().currentGame.player1).toBe(1);
  });
});

describe('ScoringEngine - fromSerialized with history', () => {
  it('deve restaurar engine com histórico', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-2-id');

    const serialized = engine.serialize();
    const restored = ScoringEngine.fromSerialized(makeConfig('BEST_OF_3'), serialized);

    expect(restored.getHistoryLength()).toBe(2);
    expect(restored.getState().currentGame.player1).toBe(1);
    expect(restored.getState().currentGame.player2).toBe(1);
  });

  it('deve restaurar engine a partir de estado legado (sem history)', () => {
    const stateOnly = JSON.stringify({
      sets: [],
      currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    });

    const restored = ScoringEngine.fromSerialized(makeConfig('BEST_OF_3'), stateOnly);
    expect(restored.getState().currentGame.player1).toBe(2);
    expect(restored.getHistoryLength()).toBe(0);
  });
});

describe('ScoringEngine - server determination', () => {
  it('deve setar server como player2 se initialServerId é player2Id', () => {
    const engine = new ScoringEngine({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p2',
    });

    expect(engine.getState().server).toBe('player2');
  });
});

describe('ScoringEngine - loadState', () => {
  it('deve carregar novo estado e limpar histórico', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(2);

    const newState = {
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player2' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };

    engine.loadState(newState);
    expect(engine.getHistoryLength()).toBe(0);
    expect(engine.getState().server).toBe('player2');
  });
});

describe('ScoringEngine - clearHistory', () => {
  it('deve limpar histórico sem alterar estado', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(2);

    engine.clearHistory();
    expect(engine.getHistoryLength()).toBe(0);
    expect(engine.getState().currentGame.player1).toBe(2);
  });
});

describe('ScoringEngine - reconcileWithCanonicalState', () => {
  it('deve reconciliar estado e truncar histórico quando canonicalVersion é menor', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(3);

    const canonicalState = {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };

    engine.reconcileWithCanonicalState(canonicalState, 1);
    expect(engine.getHistoryLength()).toBe(1);
  });

  it('deve manter histórico quando canonicalVersion é maior', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(2);

    const canonicalState = {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1' as const,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };

    engine.reconcileWithCanonicalState(canonicalState, 5);
    expect(engine.getHistoryLength()).toBe(2);
  });
});

describe('ScoringEngine - tiebreak advanced (BEST_OF_3)', () => {
  it('deve completar tiebreak com player2 vencedor', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));

    for (let g = 0; g < 5; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 5; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');

    expect(engine.getState().sets[0].isTiebreak).toBe(true);

    for (let i = 0; i < 7; i++) makePoint(engine, 'player-2-id');

    const state = engine.getState();
    expect(state.sets[0].player2).toBe(7);
    expect(state.setsWon.player2).toBe(1);
  });

  it('deve continuar tiebreak se diferença < 2 em 6-7', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));

    for (let g = 0; g < 5; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 5; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');

    for (let i = 0; i < 6; i++) makePoint(engine, 'player-1-id');
    for (let i = 0; i < 7; i++) makePoint(engine, 'player-2-id');

    expect(engine.getState().sets[0].tiebreakScore).toEqual({ player1: 6, player2: 7 });
    expect(engine.getState().sets[0].isTiebreak).toBe(true);

    makePoint(engine, 'player-2-id');
    expect(engine.getState().sets[0].isTiebreak).toBe(false);
    expect(engine.getState().sets[0].player2).toBe(7);
  });

  it('deve trocar sacador na soma ímpar dos pontos no tiebreak regular', () => {
    const engine = new ScoringEngine(makeConfig('BEST_OF_3'));

    for (let g = 0; g < 5; g++) winGame(engine, 'player-1-id');
    for (let g = 0; g < 5; g++) winGame(engine, 'player-2-id');
    winGame(engine, 'player-1-id');
    winGame(engine, 'player-2-id');

    expect(engine.getState().sets[0].isTiebreak).toBe(true);

    const serverBeforeTB = engine.getState().server;
    
    // Ponto 1: soma = 1 (ímpar) → deve trocar
    makePoint(engine, 'player-1-id');
    expect(engine.getState().server).not.toBe(serverBeforeTB);

    // Ponto 2: soma = 2 (par) → mantém
    makePoint(engine, 'player-1-id');
    const serverAfter2 = engine.getState().server;
    expect(engine.getState().server).toBe(serverAfter2);

    // Ponto 3: soma = 3 (ímpar) → deve trocar
    makePoint(engine, 'player-2-id');
    expect(engine.getState().server).not.toBe(serverAfter2);
  });
});
