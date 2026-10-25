import type { TimelinePoint } from '@/core/scoring/types';
import { computeDoublesPlayerStats } from '../doubles-player-stats.logic';

function createMockPoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 15, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 3,
    rallyDetails: null,
    pointDetails: {} as any,
    ...overrides,
  };
}

describe('Fase 5 - Estatísticas Individuais em Duplas', () => {
  const p1A = { id: 'p1-a', name: 'Atleta 1A' };

  it('calcula métricas individuais baseadas em serverId, hitterId e courtSide', () => {
    const points: TimelinePoint[] = [
      // 1A saca e faz Ace
      createMockPoint({ pointNumber: 1, serverId: 'p1-a', winner: 'PLAYER_1', type: 'ACE', isFirstServe: true }),
      // 1A saca e comete DF
      createMockPoint({ pointNumber: 2, serverId: 'p1-a', winner: 'PLAYER_2', type: 'DOUBLE_FAULT', isFirstServe: false }),
      // 1A acerta Winner de voleio na rede
      createMockPoint({ pointNumber: 3, hitterId: 'p1-a', winner: 'PLAYER_1', type: 'WINNER', rallyDetails: { situacao: 'rede', golpe: 'voleio' } as any }),
      // 1A comete erro não forçado
      createMockPoint({ pointNumber: 4, hitterId: 'p1-a', winner: 'PLAYER_2', type: 'UNFORCED_ERROR', rallyDetails: { tipo: 'erro_nao_forcado' } as any }),
      // Dupla 1 vence ponto pelo lado deuce
      createMockPoint({ pointNumber: 5, winner: 'PLAYER_1', courtSide: 'deuce' }),
      // Dupla 1 vence ponto pelo lado ad
      createMockPoint({ pointNumber: 6, winner: 'PLAYER_1', courtSide: 'ad' }),
    ];

    const stats = computeDoublesPlayerStats(points, p1A, 'PLAYER_1');

    expect(stats.servicePoints).toBe(2);
    expect(stats.aces).toBe(1);
    expect(stats.doubleFaults).toBe(1);
    expect(stats.servicePointsWon).toBe(1);

    expect(stats.winners).toBe(1);
    expect(stats.unforcedErrors).toBe(1);
    expect(stats.netPointsWon).toBe(1);

    expect(stats.deuceSidePointsWon).toBe(1);
    expect(stats.adSidePointsWon).toBe(1);
  });
});
