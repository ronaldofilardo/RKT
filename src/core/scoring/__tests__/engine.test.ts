import { ScoringEngine } from '../engine';

const config = {
  format: 'BEST_OF_3' as const,
  player1Id: 'player-1-id',
  player2Id: 'player-2-id',
  initialServerId: 'player-1-id',
};

describe('ScoringEngine', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine(config);
  });

  function makePoint(winnerId: string) {
    return engine.applyPoint({ winnerId, type: 'WINNER', serverId: engine.getState().server });
  }

  it('deve inicializar com estado correto', () => {
    const state = engine.getState();
    expect(state.isFinished).toBe(false);
    expect(state.winner).toBeNull();
    expect(state.server).toBe('player1');
    expect(state.currentGame.player1).toBe(0);
    expect(state.currentGame.player2).toBe(0);
  });

  it('não deve aceitar ponto em partida finalizada', () => {
    const finishedState = {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1' as const,
      isFinished: true,
      winner: 'player1' as const,
      setsWon: { player1: 2, player2: 0 },
      startedAt: null,
      secondServe: false,
    };
    const e = new ScoringEngine(config, finishedState);
    expect(() => e.applyPoint({ winnerId: 'player-1-id', type: 'WINNER', serverId: 'player-1-id' })).toThrow('MATCH_ALREADY_FINISHED');
  });

  it('deve lançar INVALID_WINNER para winnerId desconhecido', () => {
    const e = new ScoringEngine(config);
    expect(() => e.applyPoint({ winnerId: 'unknown-player', type: 'WINNER', serverId: 'player-1-id' })).toThrow('INVALID_WINNER');
  });

  it('deve progredir pontos corretamente (0 -> 15 -> 30 -> 40)', () => {
    const state1 = makePoint('player-1-id');
    expect(state1.currentGame.player1).toBe(1);

    const state2 = makePoint('player-1-id');
    expect(state2.currentGame.player1).toBe(2);

    const state3 = makePoint('player-1-id');
    expect(state3.currentGame.player1).toBe(3);
  });

  it('deve detectar Deuce corretamente em 40-40', () => {
    for (let i = 0; i < 3; i++) makePoint('player-1-id');
    for (let i = 0; i < 3; i++) makePoint('player-2-id');

    const state = engine.getState();
    expect(state.currentGame.isDeuce).toBe(true);
  });

  it('deve detectar Advantage após Deuce', () => {
    for (let i = 0; i < 3; i++) makePoint('player-1-id');
    for (let i = 0; i < 3; i++) makePoint('player-2-id');

    makePoint('player-1-id');
    expect(engine.getState().currentGame.advantage).toBe('player1');

    makePoint('player-2-id');
    expect(engine.getState().currentGame.advantage).toBeNull();
    expect(engine.getState().currentGame.isDeuce).toBe(true);
  });

  it('deve completar game quando advantage vence próximo ponto', () => {
    for (let i = 0; i < 3; i++) makePoint('player-1-id');
    for (let i = 0; i < 3; i++) makePoint('player-2-id');

    makePoint('player-1-id');
    makePoint('player-1-id');

    const state = engine.getState();
    expect(state.currentGame.player1).toBe(0);
    expect(state.currentGame.player2).toBe(0);
  });

  it('deve alternar servidor após cada game', () => {
    expect(engine.getState().server).toBe('player1');

    for (let i = 0; i < 4; i++) {
      makePoint('player-1-id');
    }

    expect(engine.getState().server).toBe('player2');
  });

  it('deve finalizar set com 6 games de diferença de 2', () => {
    for (let game = 0; game < 6; game++) {
      for (let point = 0; point < 4; point++) {
        makePoint('player-1-id');
      }
    }

    const state = engine.getState();
    expect(state.setsWon.player1).toBe(1);
    expect(state.sets.length).toBe(1);
    expect(state.sets[0].player1).toBe(6);
    expect(state.sets[0].player2).toBe(0);
  });

  it('deve iniciar e completar tiebreak em 6-6', () => {
    for (let game = 0; game < 6; game++) {
      for (let point = 0; point < 4; point++) {
        makePoint(game % 2 === 0 ? 'player-1-id' : 'player-2-id');
      }
    }
    for (let game = 0; game < 6; game++) {
      for (let point = 0; point < 4; point++) {
        makePoint(game % 2 === 0 ? 'player-2-id' : 'player-1-id');
      }
    }

    const stateBeforeTB = engine.getState();
    expect(stateBeforeTB.sets[0].isTiebreak).toBe(true);
    expect(stateBeforeTB.sets[0].tiebreakScore).toEqual({ player1: 0, player2: 0 });

    for (let i = 0; i < 7; i++) {
      makePoint('player-1-id');
    }

    const state = engine.getState();
    expect(state.sets[0].isTiebreak).toBe(false);
    expect(state.sets[0].player1).toBe(7);
    expect(state.sets[0].player2).toBe(6);
  });

  it('deve finalizar partida em Best of 3 com 2 sets', () => {
    for (let set = 0; set < 2; set++) {
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          makePoint('player-1-id');
        }
      }
    }

    const state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon.player1).toBe(2);
  });

  it('deve finalizar partida em Best of 5 com 3 sets', () => {
    const bestOf5Config = {
      ...config,
      format: 'BEST_OF_5' as const,
    };
    const engine5 = new ScoringEngine(bestOf5Config);

    const makePoint5 = (winnerId: string) => {
      engine5.applyPoint({ winnerId, type: 'WINNER', serverId: engine5.getState().server });
    };

    for (let set = 0; set < 3; set++) {
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          makePoint5('player-1-id');
        }
      }
    }

    const state = engine5.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon.player1).toBe(3);
  });

  it('deve serializar e restaurar estado corretamente', () => {
    makePoint('player-1-id');
    makePoint('player-1-id');

    const serialized = engine.serialize();
    const restored = ScoringEngine.fromSerialized(config, serialized);

    const state = restored.getState();
    expect(state.currentGame.player1).toBe(2);
    expect(state.currentGame.player2).toBe(0);
  });

  it('deve encerrar game no deuce em no-ad e o ponto do deuce define o vencedor', () => {
    const noAdConfig = {
      ...config,
      format: 'SHORT_SET_2V2_NO_AD' as const,
    };
    const noAdEngine = new ScoringEngine(noAdConfig);

    const makePointNoAd = (winnerId: string) => {
      noAdEngine.applyPoint({ winnerId, type: 'WINNER', serverId: noAdEngine.getState().server });
    };

    for (let i = 0; i < 3; i++) {
      makePointNoAd('player-1-id');
    }
    for (let i = 0; i < 3; i++) {
      makePointNoAd('player-2-id');
    }

    const state = noAdEngine.getState();
    expect(state.sets[0].player2).toBe(1);
    expect(state.sets[0].player1).toBe(0);
  });

  it('deve continuar contagem no tiebreak com pontos 1,2,3...', () => {
    for (let game = 0; game < 6; game++) {
      for (let point = 0; point < 4; point++) {
        makePoint(game % 2 === 0 ? 'player-1-id' : 'player-2-id');
      }
    }
    for (let game = 0; game < 6; game++) {
      for (let point = 0; point < 4; point++) {
        makePoint(game % 2 === 0 ? 'player-2-id' : 'player-1-id');
      }
    }

    for (let i = 0; i < 3; i++) {
      makePoint('player-1-id');
    }

    const state = engine.getState();
    expect(state.sets[0].tiebreakScore).toEqual({ player1: 3, player2: 0 });
    expect(state.currentGame.player1).toBe(0);
    expect(state.currentGame.player2).toBe(0);
  });
});
