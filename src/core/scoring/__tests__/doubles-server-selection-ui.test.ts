import { createInitialState } from '../engine.state';
import { ScoringEngine } from '../engine';
import { resolveActivePlayers } from '@/app/match/[id]/scoring/scoring-page-active-players.logic';
import { resolveDisplayState } from '@/app/match/[id]/scoring/scoring-page-display.logic';
import type { ScoringEngineConfig } from '../types';
import type { ScoringPageState } from '@/app/match/[id]/scoring/useScoringPageState';

describe('Doubles Server Selection & UI Display on Start and Change', () => {
  const p1Id = 'player-1';
  const p1PartnerId = 'player-1-partner';
  const p2Id = 'player-2';
  const p2PartnerId = 'player-2-partner';

  const baseDoublesConfig: ScoringEngineConfig = {
    format: 'BEST_OF_3',
    player1Id: p1Id,
    player2Id: p2Id,
    initialServerId: p1PartnerId, // Dupla 1 parceiro escolhido para sacar
    doubles: {
      members: {
        player1: [p1Id, p1PartnerId],
        player2: [p2Id, p2PartnerId],
      },
      initial: {
        serveOrder: {
          player1: [p1PartnerId, p1Id],
          player2: [p2Id, p2PartnerId],
        },
        receiveDeuce: {
          player1: p1Id,
          player2: p2Id,
        },
      },
    },
  };

  const mockMatch: ScoringPageState['match'] = {
    id: 'match-123',
    format: 'BEST_OF_3',
    matchType: 'DOUBLES',
    state: 'IN_PROGRESS',
    player1Id: p1Id,
    player2Id: p2Id,
    player1PartnerId: p1PartnerId,
    player2PartnerId: p2PartnerId,
    player1: { id: p1Id, name: 'Alice Titular' },
    player2: { id: p2Id, name: 'Bob Titular' },
    player1Partner: { id: p1PartnerId, name: 'Alice Parceira' },
    player2Partner: { id: p2PartnerId, name: 'Bob Parceiro' },
    initialServerId: p1PartnerId,
    doublesSetup: {
      serveOrder: {
        player1: [p1PartnerId, p1Id],
        player2: [p2Id, p2PartnerId],
      },
      receiveDeuce: {
        player1: p1Id,
        player2: p2Id,
      },
      changes: [],
    },
    version: 1,
  };

  it('1. Ao iniciar com parceiro da Dupla 1, engine e UI apontam sacador para o parceiro da Dupla 1', () => {
    const initialState = createInitialState(baseDoublesConfig);
    expect(initialState.server).toBe('player1');

    const engine = new ScoringEngine(baseDoublesConfig);
    expect(engine.getServingMemberId()).toBe(p1PartnerId);

    const displayState = resolveDisplayState({
      activeModal: null,
      scoreState: initialState,
      pendingEditScore: null,
      suspendedSession: null,
      match: mockMatch,
    });

    expect(displayState?.server).toBe('player1');
    const { activeServerId } = resolveActivePlayers(displayState, mockMatch);
    expect(activeServerId).toBe(p1PartnerId);
  });

  it('2. Ao iniciar com parceiro da Dupla 2, engine e UI apontam sacador para o parceiro da Dupla 2', () => {
    const p2PartnerConfig: ScoringEngineConfig = {
      ...baseDoublesConfig,
      initialServerId: p2PartnerId,
      doubles: {
        ...baseDoublesConfig.doubles!,
        initial: {
          ...baseDoublesConfig.doubles!.initial,
          serveOrder: {
            player1: [p1Id, p1PartnerId],
            player2: [p2PartnerId, p2Id],
          },
        },
      },
    };

    const matchP2Partner: ScoringPageState['match'] = {
      ...mockMatch,
      initialServerId: p2PartnerId,
      doublesSetup: {
        serveOrder: {
          player1: [p1Id, p1PartnerId],
          player2: [p2PartnerId, p2Id],
        },
        receiveDeuce: {
          player1: p1Id,
          player2: p2Id,
        },
        changes: [],
      },
    };

    const initialState = createInitialState(p2PartnerConfig);
    expect(initialState.server).toBe('player2');

    const engine = new ScoringEngine(p2PartnerConfig);
    expect(engine.getServingMemberId()).toBe(p2PartnerId);

    const displayState = resolveDisplayState({
      activeModal: null,
      scoreState: initialState,
      pendingEditScore: null,
      suspendedSession: null,
      match: matchP2Partner,
    });

    expect(displayState?.server).toBe('player2');
    const { activeServerId } = resolveActivePlayers(displayState, matchP2Partner);
    expect(activeServerId).toBe(p2PartnerId);
  });

  it('3. Ao corrigir sacador para Dupla 2 Parceiro antes do 1o ponto, UI atualiza imediatamente', () => {
    const engine = new ScoringEngine(baseDoublesConfig);
    expect(engine.getServingMemberId()).toBe(p1PartnerId);

    // Corrige para p2PartnerId
    engine.setGameServer(p2PartnerId);
    expect(engine.getServingMemberId()).toBe(p2PartnerId);

    const updatedState = engine.getState();
    expect(updatedState.server).toBe('player2');

    const matchAfterCorrection: ScoringPageState['match'] = {
      ...mockMatch,
      initialServerId: p2PartnerId,
    };

    const displayState = resolveDisplayState({
      activeModal: null,
      scoreState: updatedState,
      pendingEditScore: null,
      suspendedSession: null,
      match: matchAfterCorrection,
    });

    expect(displayState?.server).toBe('player2');
    const { activeServerId } = resolveActivePlayers(displayState, matchAfterCorrection);
    expect(activeServerId).toBe(p2PartnerId);
  });
});
