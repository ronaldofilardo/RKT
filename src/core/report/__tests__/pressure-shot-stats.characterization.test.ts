import type { TimelinePoint } from '@/core/scoring/types';
import { computeShotAnalysis, getPointShotDetails } from '../pressure-shot-stats';

function createMockPoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'POINT',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 3,
    rallyDetails: null,
    ...overrides,
  };
}

describe('pressure-shot-stats - Shot & Stroke Attribution (Fundo, Rede, Passada)', () => {
  it('atribui corretamente golpes em situações de Fundo e Devolução', () => {
    // 1. P1 acerta winner de forehand no fundo
    const p1WinnerFundo = createMockPoint({
      winner: 'PLAYER_1',
      rallyDetails: { situacao: 'fundo', golpe: 'fh', tipo: 'winner' } as any,
    });
    const d1 = getPointShotDetails(p1WinnerFundo);
    expect(d1).toEqual({
      executor: 'PLAYER_1',
      outcome: 'winner',
      stroke: 'fh',
      strokeSide: 'forehand',
      situacao: 'fundo',
    });

    // 2. P2 comete erro não forçado de backhand no fundo (P1 vence o ponto)
    const p2ErrorFundo = createMockPoint({
      winner: 'PLAYER_1',
      rallyDetails: { situacao: 'fundo', golpe: 'bh', tipo: 'erro_nao_forcado' } as any,
    });
    const d2 = getPointShotDetails(p2ErrorFundo);
    expect(d2).toEqual({
      executor: 'PLAYER_2',
      outcome: 'unforced_error',
      stroke: 'bh',
      strokeSide: 'backhand',
      situacao: 'fundo',
    });
  });

  it('atribui corretamente golpes em situações de Vencedor > Rede', () => {
    // i. Vencedor (P1) na rede acerta winner de voleio backhand
    const p1WinnerRede = createMockPoint({
      winner: 'PLAYER_1',
      rallyDetails: { situacao: 'rede', golpe: 'vbh', tipo: 'winner' } as any,
    });
    const d1 = getPointShotDetails(p1WinnerRede);
    expect(d1).toEqual({
      executor: 'PLAYER_1',
      outcome: 'winner',
      stroke: 'vbh',
      strokeSide: 'backhand',
      situacao: 'rede',
    });

    // ii. Vencedor (P1) na rede, adversário (P2) comete erro forçado na passada de forehand
    const p2ErrorRede = createMockPoint({
      winner: 'PLAYER_1',
      rallyDetails: { situacao: 'rede', golpe: 'fh', tipo: 'erro_forcado' } as any,
    });
    const d2 = getPointShotDetails(p2ErrorRede);
    expect(d2).toEqual({
      executor: 'PLAYER_2',
      outcome: 'forced_error',
      stroke: 'fh',
      strokeSide: 'forehand',
      situacao: 'rede',
    });
  });

  it('atribui corretamente golpes em situações de Vencedor > Passada', () => {
    // i. Vencedor (P1) faz passada de winner de backhand do fundo
    const p1WinnerPassada = createMockPoint({
      winner: 'PLAYER_1',
      rallyDetails: { situacao: 'passada', golpe: 'bh', tipo: 'winner' } as any,
    });
    const d1 = getPointShotDetails(p1WinnerPassada);
    expect(d1).toEqual({
      executor: 'PLAYER_1',
      outcome: 'winner',
      stroke: 'bh',
      strokeSide: 'backhand',
      situacao: 'passada',
    });

    // ii. Vencedor (P1) força o ponto e adversário (P2) erra voleio de backhand (VBH) na rede
    const p2ErrorPassada = createMockPoint({
      winner: 'PLAYER_1',
      rallyDetails: { situacao: 'passada', golpe: 'vbh', tipo: 'erro_nao_forcado' } as any,
    });
    const d2 = getPointShotDetails(p2ErrorPassada);
    expect(d2).toEqual({
      executor: 'PLAYER_2',
      outcome: 'unforced_error',
      stroke: 'vbh',
      strokeSide: 'backhand',
      situacao: 'passada',
    });
  });

  it('calcula estatísticas agregadas de backhand e forehand sem contaminação por winners do adversário', () => {
    const points: TimelinePoint[] = [
      // P1 acerta winner de BH
      createMockPoint({
        winner: 'PLAYER_1',
        rallyDetails: { situacao: 'fundo', golpe: 'bh', tipo: 'winner' } as any,
      }),
      // P1 comete erro não forçado de BH (P2 ganha o ponto)
      createMockPoint({
        winner: 'PLAYER_2',
        rallyDetails: { situacao: 'fundo', golpe: 'bh', tipo: 'erro_nao_forcado' } as any,
      }),
      // P1 comete erro forçado de BH (P2 ganha o ponto)
      createMockPoint({
        winner: 'PLAYER_2',
        rallyDetails: { situacao: 'rede', golpe: 'bh', tipo: 'erro_forcado' } as any,
      }),
      // P2 acerta winner de BH (P2 ganha o ponto) - NÃO deve ser contado como erro de P1!
      createMockPoint({
        winner: 'PLAYER_2',
        rallyDetails: { situacao: 'fundo', golpe: 'bh', tipo: 'winner' } as any,
      }),
    ];

    const statsP1 = computeShotAnalysis(points, 1);
    const statsP2 = computeShotAnalysis(points, 2);

    // P1: 1 winner de BH, 1 ENF de BH, 1 EF de BH
    expect(statsP1.backhandStats).toEqual({
      winners: 1,
      unforcedErrors: 1,
      forcedErrors: 1,
      total: 3,
    });
    expect(statsP1.unforcedErrorsByStroke.bh).toBe(1);
    expect(statsP1.forcedErrorsByStroke.bh).toBe(1);

    // P2: 1 winner de BH, 0 ENF de BH, 0 EF de BH
    expect(statsP2.backhandStats).toEqual({
      winners: 1,
      unforcedErrors: 0,
      forcedErrors: 0,
      total: 1,
    });
  });
});
