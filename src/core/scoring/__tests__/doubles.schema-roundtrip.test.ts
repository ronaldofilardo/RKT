import { ScoringEngine } from '../engine';
import { normalizeScoreState } from '../score-normalizer';
import { MatchScoreStateEnvelopeSchema, MatchScoreStateSchema } from '@/schemas/match';
import type { DoublesConfig, ScoringEngineConfig } from '../types';

describe('Doubles State Schema Round-trip (Fase B4)', () => {
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

  const config: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: 'p1_titular',
    player2Id: 'p2_titular',
    initialServerId: 'p1_titular',
    doubles: doublesConfig,
  };

  it('preserva doubles em serialize -> normalize -> parse -> fromSerialized', () => {
    const engine = new ScoringEngine(config);

    // Aplica alguns pontos
    engine.applyPoint({ winnerId: 'p1_titular', type: 'ACE', serverId: 'p1_titular' });
    engine.applyPoint({ winnerId: 'p2_titular', type: 'WINNER', serverId: 'p1_titular' });

    const serialized = engine.serialize();
    expect(serialized).toContain('"doubles"');

    // 1. parse pelo Schema Zod de Envelope
    const parsedEnvelope = MatchScoreStateEnvelopeSchema.parse(JSON.parse(serialized));
    expect(parsedEnvelope.state.doubles).toBeDefined();
    expect(parsedEnvelope.state.doubles?.serveOrder.player1).toEqual(['p1_titular', 'p1_parceiro']);
    expect(parsedEnvelope.state.doubles?.serveIndex.player1).toBe(0);

    // 2. normalizeScoreState preserva doubles
    const normalized = normalizeScoreState(JSON.parse(serialized), 'BEST_OF_3');
    expect(normalized).toBeDefined();
    expect((normalized as any).doubles).toBeDefined();
    expect((normalized as any).doubles.serveOrder.player1).toEqual(['p1_titular', 'p1_parceiro']);

    // 3. parse pelo Schema plano de MatchScoreState
    const parsedFlat = MatchScoreStateSchema.parse(normalized);
    expect(parsedFlat.doubles).toBeDefined();
    expect(parsedFlat.doubles?.receiveDeuce.player1).toBe('p1_titular');

    // 4. fromSerialized reidrata o ScoringEngine com o estado e arranjo de duplas intactos
    const rehydrated = ScoringEngine.fromSerialized(config, serialized);
    const rehydratedState = rehydrated.getState();
    expect(rehydratedState.doubles).toBeDefined();
    expect(rehydratedState.doubles?.serveOrder).toEqual(doublesConfig.initial.serveOrder);
    expect(rehydratedState.doubles?.receiveDeuce).toEqual(doublesConfig.initial.receiveDeuce);
  });

  it('undoLastPoint restaura exatamente o estado anterior de doubles e histórico', () => {
    const engine = new ScoringEngine(config);

    engine.applyPoint({ winnerId: 'p1_titular', type: 'ACE', serverId: 'p1_titular' });
    const stateAfterP1 = engine.getState();

    // Vence mais 3 pontos para fechar o 1º game (40-0 -> fecha game)
    engine.applyPoint({ winnerId: 'p1_titular', type: 'WINNER', serverId: 'p1_titular' });
    engine.applyPoint({ winnerId: 'p1_titular', type: 'WINNER', serverId: 'p1_titular' });
    engine.applyPoint({ winnerId: 'p1_titular', type: 'WINNER', serverId: 'p1_titular' });

    const stateAfterGame = engine.getState();
    // Após fechar o game sacado por player1, o serveIndex de player1 avançou para 1
    expect(stateAfterGame.doubles?.serveIndex.player1).toBe(1);
    expect(stateAfterGame.server).toBe('player2');

    // Undo do ponto final do game
    const undone = engine.undoLastPoint();
    expect(undone).not.toBeNull();

    const stateAfterUndo = engine.getState();
    // Voltou para 40-0 no game 1, sacador ainda player1 e serveIndex de player1 voltou a 0
    expect(stateAfterUndo.server).toBe('player1');
    expect(stateAfterUndo.doubles?.serveIndex.player1).toBe(0);
    expect(stateAfterUndo.currentGame.player1).toBe(3);
  });
});
