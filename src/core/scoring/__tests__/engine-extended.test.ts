import { ScoringEngine } from '../engine';
import type { PointFlow } from '../types';

const config = {
  format: 'BEST_OF_3' as const,
  player1Id: 'player-1-id',
  player2Id: 'player-2-id',
  initialServerId: 'player-1-id',
};

function createEngine(format: 'BEST_OF_3' | 'SHORT_SET_2V2_NO_AD' = 'BEST_OF_3') {
  return new ScoringEngine({
    format,
    player1Id: 'player-1-id',
    player2Id: 'player-2-id',
    initialServerId: 'player-1-id',
  });
}

function makePoint(engine: ScoringEngine, winnerId: string, type: string = 'WINNER') {
  const state = engine.getState();
  const serverId = state.server === 'player1' ? 'player-1-id' : 'player-2-id';
  const flow: PointFlow = { winnerId, type, serverId };
  return engine.applyPoint(flow);
}

describe('ScoringEngine - Basic Operations', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  describe('getState', () => {
    it('deve retornar estado inicial com sets vazios', () => {
      const state = engine.getState();
      expect(state.sets).toEqual([]);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
      expect(state.server).toBe('player1');
      expect(state.isFinished).toBe(false);
    });

    it('deve retornar winner como null no início', () => {
      expect(engine.getWinner()).toBeNull();
    });
  });

  describe('applyPoint', () => {
    it('deve incrementar score do jogador que venceu', () => {
      makePoint(engine, 'player-1-id');
      const state = engine.getState();
      expect(state.currentGame.player1).toBe(1);
    });

    it('deve alternar servidor após cada game', () => {
      for (let i = 0; i < 4; i++) makePoint(engine, 'player-1-id');
      expect(engine.getState().server).toBe('player2');

      for (let i = 0; i < 4; i++) makePoint(engine, 'player-2-id');
      expect(engine.getState().server).toBe('player1');
    });
  });
});

describe('ScoringEngine - undoLastPoint', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  it('deve retornar null quando não há histórico', () => {
    expect(engine.undoLastPoint()).toBeNull();
  });

  it('deve restaurar estado anterior após undo', () => {
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    const beforeUndo = engine.getState();

    engine.undoLastPoint();
    const afterUndo = engine.getState();

    expect(afterUndo.currentGame.player1).toBe(beforeUndo.currentGame.player1 - 1);
  });
});

describe('ScoringEngine - getHistoryLength', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  it('deve retornar 0 no início', () => {
    expect(engine.getHistoryLength()).toBe(0);
  });

  it('deve incrementar ao aplicar pontos', () => {
    makePoint(engine, 'player-1-id');
    expect(engine.getHistoryLength()).toBe(1);
    makePoint(engine, 'player-2-id');
    expect(engine.getHistoryLength()).toBe(2);
  });
});

describe('ScoringEngine - Basic Game Win', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  it('deve vencer game com 4 pontos', () => {
    for (let i = 0; i < 4; i++) {
      makePoint(engine, 'player-1-id');
    }

    const state = engine.getState();
    expect(state.sets[0].player1).toBe(1);
    expect(state.currentGame.player1).toBe(0);
  });

  it('deve marcar isFinished ao vencer partida', () => {
    for (let set = 0; set < 2; set++) {
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          makePoint(engine, 'player-1-id');
        }
      }
    }

    expect(engine.isFinished()).toBe(true);
    expect(engine.getWinner()).toBe('player1');
  });
});

describe('ScoringEngine - Format SHORT_SET_2V2_NO_AD', () => {
  it('deve criar engine com formato NO_AD', () => {
    const engine = new ScoringEngine({
      format: 'SHORT_SET_2V2_NO_AD',
      player1Id: 'player-1-id',
      player2Id: 'player-2-id',
      initialServerId: 'player-1-id',
    });

    const state = engine.getState();
    expect(state.sets).toEqual([]);
    expect(state.isFinished).toBe(false);
  });
});

describe('ScoringEngine - Deuce', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  it('deve entrar em deuce quando ambos têm 3 pontos', () => {
    for (let i = 0; i < 3; i++) makePoint(engine, 'player-1-id');
    for (let i = 0; i < 3; i++) makePoint(engine, 'player-2-id');

    const state = engine.getState();
    expect(state.currentGame.isDeuce).toBe(true);
  });
});

describe('ScoringEngine - serialize/deserialize', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  it('deve serializar e restaurar engine', () => {
    for (let i = 0; i < 5; i++) {
      makePoint(engine, 'player-1-id');
    }

    const serialized = engine.serialize();
    const restored = ScoringEngine.fromSerialized({
      format: 'BEST_OF_3',
      player1Id: 'player-1-id',
      player2Id: 'player-2-id',
      initialServerId: 'player-1-id',
    }, serialized);

    expect(restored.getHistoryLength()).toBe(5);
  });

  it('deve restaurar estado finalizado', () => {
    for (let set = 0; set < 2; set++) {
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          makePoint(engine, 'player-1-id');
        }
      }
    }

    const serialized = engine.serialize();
    const restored = ScoringEngine.fromSerialized({
      format: 'BEST_OF_3',
      player1Id: 'player-1-id',
      player2Id: 'player-2-id',
      initialServerId: 'player-1-id',
    }, serialized);

    expect(restored.isFinished()).toBe(true);
    expect(restored.getWinner()).toBe('player1');
  });
});

describe('ScoringEngine - setStartedAt', () => {
  it('deve definir startedAt no estado', () => {
    const engine = createEngine();
    const timestamp = 1700000000000;
    engine.setStartedAt(timestamp);

    expect(engine.getState().startedAt).toBe(timestamp);
  });
});

describe('ScoringEngine - getPointHistory', () => {
  it('deve retornar histórico vazio inicialmente', () => {
    const engine = createEngine();
    expect(engine.getPointHistory()).toEqual([]);
  });

  it('deve adicionar pontos ao histórico', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-2-id');

    const history = engine.getPointHistory();
    expect(history.length).toBe(2);
  });
});

describe('ScoringEngine - restorePointHistory', () => {
  it('deve restaurar histórico fornecido', () => {
    const engine = createEngine();
    makePoint(engine, 'player-1-id');
    const originalHistory = [...engine.getPointHistory()];

    engine.restorePointHistory(originalHistory);

    expect(engine.getHistoryLength()).toBe(originalHistory.length);
  });
});

describe('ScoringEngine - getServer', () => {
  it('deve retornar servidor inicial', () => {
    const engine = createEngine();
    expect(engine.getServer()).toBe('player1');
  });

  it('deve alternar servidor após game', () => {
    const engine = createEngine();
    for (let i = 0; i < 4; i++) makePoint(engine, 'player-1-id');
    expect(engine.getServer()).toBe('player2');
  });
});

describe('ScoringEngine - isFinished', () => {
  it('deve retornar false no início', () => {
    const engine = createEngine();
    expect(engine.isFinished()).toBe(false);
  });

  it('deve retornar true após partida terminar', () => {
    const engine = createEngine();
    for (let set = 0; set < 2; set++) {
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          makePoint(engine, 'player-1-id');
        }
      }
    }

    expect(engine.isFinished()).toBe(true);
  });
});

describe('ScoringEngine - undoLastPoint advanced scenarios', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  it('deve restaurar estado de deuce após undo', () => {
    // 40x30
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-1-id');
    makePoint(engine, 'player-2-id');
    makePoint(engine, 'player-2-id');
    makePoint(engine, 'player-2-id');

    // Agora está 40x40 (deuce)
    const beforeDeuce = engine.getState();
    expect(beforeDeuce.currentGame.isDeuce).toBe(true);

    // Undo do último ponto (volta para 40x30)
    engine.undoLastPoint();
    const afterUndo = engine.getState();
    expect(afterUndo.currentGame.isDeuce).toBe(false);
    expect(afterUndo.currentGame.player1).toBe(3);
    expect(afterUndo.currentGame.player2).toBe(2);
  });

  it('deve restaurar vantagem após undo', () => {
    // Chegar no deuce
    for (let i = 0; i < 3; i++) makePoint(engine, 'player-1-id');
    for (let i = 0; i < 3; i++) makePoint(engine, 'player-2-id');

    // Player 1 ganha vantagem
    makePoint(engine, 'player-1-id');
    let state = engine.getState();
    expect(state.currentGame.advantage).toBe('player1');

    // Undo volta para deuce
    engine.undoLastPoint();
    state = engine.getState();
    expect(state.currentGame.isDeuce).toBe(true);
    expect(state.currentGame.advantage).toBeNull();
  });

  it('deve permitir múltiplos undos sequenciais', () => {
    makePoint(engine, 'player-1-id'); // 15x0
    makePoint(engine, 'player-1-id'); // 30x0
    makePoint(engine, 'player-1-id'); // 40x0

    let state = engine.getState();
    expect(state.currentGame.player1).toBe(3);

    engine.undoLastPoint(); // volta para 30x0
    state = engine.getState();
    expect(state.currentGame.player1).toBe(2);

    engine.undoLastPoint(); // volta para 15x0
    state = engine.getState();
    expect(state.currentGame.player1).toBe(1);

    engine.undoLastPoint(); // volta para 0x0
    state = engine.getState();
    expect(state.currentGame.player1).toBe(0);
  });

  it('deve retornar null ao tentar undo em estado inicial', () => {
    const result = engine.undoLastPoint();
    expect(result).toBeNull();
  });

  it('deve retornar detalhes do ponto desfeito', () => {
    makePoint(engine, 'player-1-id', 'WINNER');
    const undone = engine.undoLastPoint();
    expect(undone).not.toBeNull();
    expect(undone?.type).toBe('WINNER');
    expect(undone?.winnerId).toBe('player-1-id');
  });
});