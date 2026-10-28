import type { TimelinePoint } from '@/core/scoring/types';
import { computeAdvancedStats } from '../compute-stats';

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

describe('Fase 2 - Novas Seções e Métricas da Planilha', () => {
  it('calcula métricas de devolução excluindo DF e medindo retorno em quadra', () => {
    const points: TimelinePoint[] = [
      // P1 saca: Ace no 1º saque (devolução não entrou)
      createMockPoint({ pointNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'ACE', isFirstServe: true, isSecondServe: false }),
      // P1 saca: P2 acerta devolução e vence
      createMockPoint({ pointNumber: 2, server: 'player1', winner: 'PLAYER_2', type: 'WINNER', isFirstServe: true, isSecondServe: false, rallyDetails: { situacao: 'devolucao' } as any }),
      // P1 saca: 2º saque, DF (não conta como devolução)
      createMockPoint({ pointNumber: 3, server: 'player1', winner: 'PLAYER_2', type: 'DOUBLE_FAULT', isFirstServe: false, isSecondServe: true }),
      // P1 saca: 2º saque, P2 erra devolução
      createMockPoint({ pointNumber: 4, server: 'player1', winner: 'PLAYER_1', type: 'UNFORCED_ERROR', isFirstServe: false, isSecondServe: true, rallyDetails: { situacao: 'devolucao' } as any }),
    ];

    const stats = computeAdvancedStats(points);
    const p2Return = stats.returnStats.player2;

    expect(p2Return.totalReturnPoints).toBe(3); // 4 pontos - 1 DF = 3
    expect(p2Return.returnPointsWon).toBe(2); // Venceu no pt 2 e no pt 3 (DF)
    expect(p2Return.returnPointsWonPct).toBeCloseTo((2 / 3) * 100);
    expect(p2Return.firstServeReturnInPct).toBe(50); // 1 ace, 1 devolução que entrou de 2 pts
    expect(p2Return.secondServeReturnInPct).toBe(0); // 1 erro de devolução de 1 pt jogável
  });

  it('calcula fundo de quadra, rede/passada e definição sem ace/DF', () => {
    const points: TimelinePoint[] = [
      createMockPoint({ pointNumber: 1, winner: 'PLAYER_1', type: 'WINNER', rallyLength: 2, rallyDetails: { situacao: 'fundo', golpe: 'forehand' } as any }),
      createMockPoint({ pointNumber: 2, winner: 'PLAYER_2', type: 'UNFORCED_ERROR', rallyLength: 5, rallyDetails: { situacao: 'fundo', golpe: 'backhand' } as any }),
      createMockPoint({ pointNumber: 3, winner: 'PLAYER_1', type: 'WINNER', rallyDetails: { situacao: 'rede', golpe: 'voleio', lado: 'forehand' } as any }),
      createMockPoint({ pointNumber: 4, winner: 'PLAYER_2', type: 'WINNER', rallyDetails: { situacao: 'passada', golpe: 'forehand' } as any }),
      createMockPoint({ pointNumber: 5, winner: 'PLAYER_1', type: 'ACE', server: 'player1' }),
      createMockPoint({ pointNumber: 6, winner: 'PLAYER_2', type: 'DOUBLE_FAULT', server: 'player1' }),
    ];

    const stats = computeAdvancedStats(points);

    // Fundo de quadra
    expect(stats.baseline?.player1.winners).toBe(1);
    expect(stats.baseline?.player1.unforcedErrors).toBe(1);
    expect(stats.baseline?.player1.shortRallyWon).toBeGreaterThanOrEqual(0);
    expect(stats.baseline?.player1.shortRallyTotal).toBeGreaterThanOrEqual(0);

    // Rede e Passada
    expect(stats.netPass?.player1.netApproaches).toBe(2); // Pt 3 (P1 subiu e ganhou) + Pt 4 (P1 subiu e P2 passou)
    expect(stats.netPass?.player1.netApproachesWon).toBe(1);
    expect(stats.netPass?.player2.passingShotsWon).toBe(1);

    // Definição sem ace nem DF
    expect(stats.pointDefinition?.player1.cleanWinners).toBe(2); // Pt 1 e Pt 3 (sem contar Ace pt 5)
    expect(stats.pointDefinition?.player1.unforcedErrors).toBe(1); // Pt 2 (não conta DF pt 6)

    // Matriz de golpes
    const sqP1 = stats.strokeMatrix?.player1.find(r => r.code === 'sq');
    expect(sqP1?.winners).toBe(1); // Ace
    expect(sqP1?.unforcedErrors).toBe(1); // DF
    const fhP1 = stats.strokeMatrix?.player1.find(r => r.code === 'fh');
    expect(fhP1?.winners).toBe(1); // Pt 1
  });
});
