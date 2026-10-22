import { ScoringEngine } from '../engine';
import type { DoublesConfig, ScoringEngineConfig } from '../types';

describe('ScoringEngine — Integração com Duplas (Fase B)', () => {
  const p1A = 'p1_atleta_a';
  const p1B = 'p1_atleta_b';
  const p2C = 'p2_atleta_c';
  const p2D = 'p2_atleta_d';

  const doublesConfig: DoublesConfig = {
    members: {
      player1: [p1A, p1B],
      player2: [p2C, p2D],
    },
    initial: {
      serveOrder: {
        player1: [p1A, p1B],
        player2: [p2C, p2D],
      },
      receiveDeuce: {
        player1: p1A,
        player2: p2C,
      },
    },
  };

  const engineConfig: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: p1A,
    player2Id: p2C,
    initialServerId: p1A,
    doubles: doublesConfig,
  };

  const winFourPoints = (engine: ScoringEngine, winnerId: string) => {
    for (let i = 0; i < 4; i++) {
      engine.applyPoint({ winnerId, type: 'WINNER', serverId: '' });
    }
  };

  it('rotaciona os sacadores ao longo dos games: A1, B1, A2, B2, A1...', () => {
    const engine = new ScoringEngine(engineConfig);

    // Game 1: saca Dupla 1, índice 0 (p1A)
    let history = engine.getPointHistory();
    expect(engine.getState().server).toBe('player1');
    expect(engine.getState().doubles?.serveIndex.player1).toBe(0);

    // Dupla 1 vence Game 1
    winFourPoints(engine, p1A);
    history = engine.getPointHistory();
    const lastPointG1 = history[history.length - 1].point;
    expect(lastPointG1.serverId).toBe(p1A);

    // Game 2: saca Dupla 2, índice 0 (p2C)
    expect(engine.getState().server).toBe('player2');
    expect(engine.getState().doubles?.serveIndex.player2).toBe(0);
    expect(engine.getState().doubles?.serveIndex.player1).toBe(1); // p1 já virou

    // Dupla 2 vence Game 2
    winFourPoints(engine, p2C);
    history = engine.getPointHistory();
    const lastPointG2 = history[history.length - 1].point;
    expect(lastPointG2.serverId).toBe(p2C);

    // Game 3: saca Dupla 1, índice 1 (p1B)
    expect(engine.getState().server).toBe('player1');
    expect(engine.getState().doubles?.serveIndex.player1).toBe(1);

    // Dupla 1 vence Game 3
    winFourPoints(engine, p1B);
    history = engine.getPointHistory();
    const lastPointG3 = history[history.length - 1].point;
    expect(lastPointG3.serverId).toBe(p1B);

    // Game 4: saca Dupla 2, índice 1 (p2D)
    expect(engine.getState().server).toBe('player2');
    expect(engine.getState().doubles?.serveIndex.player2).toBe(1);

    // Dupla 2 vence Game 4
    winFourPoints(engine, p2D);
    history = engine.getPointHistory();
    const lastPointG4 = history[history.length - 1].point;
    expect(lastPointG4.serverId).toBe(p2D);

    // Game 5: saca Dupla 1, volta para o índice 0 (p1A)
    expect(engine.getState().server).toBe('player1');
    expect(engine.getState().doubles?.serveIndex.player1).toBe(0);
  });

  it('no ponto decisivo de No-Ad, respeita o override do devolvedor', () => {
    const noAdConfig: ScoringEngineConfig = {
      ...engineConfig,
      format: 'BEST_OF_3_NO_AD',
    };
    const engine = new ScoringEngine(noAdConfig);

    // Leva game a 40-40 (3 pontos para cada)
    engine.applyPoint({ winnerId: p1A, type: 'WINNER', serverId: '' });
    engine.applyPoint({ winnerId: p2C, type: 'WINNER', serverId: '' });
    engine.applyPoint({ winnerId: p1A, type: 'WINNER', serverId: '' });
    engine.applyPoint({ winnerId: p2C, type: 'WINNER', serverId: '' });
    engine.applyPoint({ winnerId: p1A, type: 'WINNER', serverId: '' });
    engine.applyPoint({ winnerId: p2C, type: 'WINNER', serverId: '' });

    expect(engine.getState().currentGame.isDeuce).toBe(true);

    // Ponto decisivo: Dupla 1 saca, Dupla 2 escolhe p2D para devolver (override)
    engine.applyPoint({
      winnerId: p1A,
      type: 'WINNER',
      serverId: '',
      receiverId: p2D,
    });

    const history = engine.getPointHistory();
    const deciderPoint = history[history.length - 1].point;
    expect(deciderPoint.receiverId).toBe(p2D);
  });

  it('propriedade de equivalência: partidas de simples têm comportamento idêntico', () => {
    const singlesConfig: ScoringEngineConfig = {
      format: 'BEST_OF_3',
      player1Id: 'player-alpha',
      player2Id: 'player-beta',
      initialServerId: 'player-alpha',
    };

    const engineSingles = new ScoringEngine(singlesConfig);
    // Aplica 10 pontos alternados
    const sequence = [
      'player-alpha',
      'player-alpha',
      'player-beta',
      'player-alpha',
      'player-alpha', // Fecha Game 1
      'player-beta',
      'player-beta',
      'player-alpha',
      'player-beta',
      'player-beta', // Fecha Game 2
    ];

    for (const winner of sequence) {
      engineSingles.applyPoint({ winnerId: winner, type: 'WINNER', serverId: 'player-alpha' });
    }

    const state = engineSingles.getState();
    expect(state.doubles).toBeUndefined();
    expect(state.sets[0].player1).toBe(1);
    expect(state.sets[0].player2).toBe(1);
    expect(state.server).toBe('player1');
  });
});
