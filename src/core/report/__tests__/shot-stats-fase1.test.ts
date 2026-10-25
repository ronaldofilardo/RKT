import type { TimelinePoint } from '@/core/scoring/types';
import {
  computeShotAnalysis,
  getPointShotDetails,
  resolvePointRallyCategory,
  resolvePointEffectiveRallyLength,
} from '../pressure-shot-stats';

function createPoint(overrides: Partial<TimelinePoint>): TimelinePoint {
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
    pointDetails: {} as any,
    ...overrides,
  };
}

describe('Fase 1 - Itens 1.1, 1.2 e 1.5 (Estatísticas Avançadas)', () => {
  describe('Item 1.2: Ace e Dupla Falta excluídos de lances de rali/winners/ENF', () => {
    it('retorna null em getPointShotDetails para ACE mesmo com rallyDetails com tipo winner', () => {
      const acePoint = createPoint({
        type: 'ACE',
        winner: 'PLAYER_1',
        rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'winner' } as any,
      });
      expect(getPointShotDetails(acePoint)).toBeNull();
    });

    it('retorna null em getPointShotDetails para DOUBLE_FAULT e tipo dupla_falta', () => {
      const dfPoint = createPoint({
        type: 'DOUBLE_FAULT',
        winner: 'PLAYER_2',
        rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'dupla_falta' } as any,
      });
      expect(getPointShotDetails(dfPoint)).toBeNull();
    });

    it('não conta ACE como winner nem DOUBLE_FAULT como unforcedError em computeShotAnalysis', () => {
      const points: TimelinePoint[] = [
        createPoint({
          type: 'ACE',
          winner: 'PLAYER_1',
          rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'winner' } as any,
        }),
        createPoint({
          type: 'DOUBLE_FAULT',
          winner: 'PLAYER_1',
          rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'dupla_falta' } as any,
        }),
        createPoint({
          type: 'WINNER',
          winner: 'PLAYER_1',
          rallyDetails: { situacao: 'fundo', golpe: 'fh', tipo: 'winner' } as any,
        }),
      ];

      const p1Stats = computeShotAnalysis(points, 1);
      const p2Stats = computeShotAnalysis(points, 2);

      expect(p1Stats.winners).toBe(1);
      expect(p2Stats.unforcedErrors).toBe(0);
    });
  });

  describe('Item 1.1: Faixas de rally por duracao e compatibilidade', () => {
    it('classifica duracao opcao_1 como short, opcao_2 como medium, opcao_3 como long', () => {
      const pShort = createPoint({ rallyLength: 1, rallyDetails: { duracao: 'opcao_1' } as any });
      const pMedium = createPoint({ rallyLength: 2, rallyDetails: { duracao: 'opcao_2' } as any });
      const pLong = createPoint({ rallyLength: 2, rallyDetails: { duracao: 'opcao_3' } as any });

      expect(resolvePointRallyCategory(pShort)).toBe('short');
      expect(resolvePointRallyCategory(pMedium)).toBe('medium');
      expect(resolvePointRallyCategory(pLong)).toBe('long');
    });

    it('resolve tamanho efetivo do rally para pontos antigos com valor padrão 1 ou 2', () => {
      const pMediumLegacy = createPoint({ rallyLength: 1, rallyDetails: { duracao: 'opcao_2' } as any });
      const pLongLegacy = createPoint({ rallyLength: 2, rallyDetails: { duracao: 'opcao_3' } as any });

      expect(resolvePointEffectiveRallyLength(pMediumLegacy)).toBe(6);
      expect(resolvePointEffectiveRallyLength(pLongLegacy)).toBe(10);
    });
  });

  describe('Item 1.5: Subidas à rede bilaterais', () => {
    it('calcula subidas como Rede ganhas + Passada perdidas pelo jogador', () => {
      const points: TimelinePoint[] = [
        createPoint({
          winner: 'PLAYER_1',
          rallyDetails: { situacao: 'rede', golpe: 'vfh', tipo: 'winner' } as any,
        }),
        createPoint({
          winner: 'PLAYER_2',
          rallyDetails: { situacao: 'passada', golpe: 'bh', tipo: 'winner' } as any,
        }),
        createPoint({
          winner: 'PLAYER_2',
          rallyDetails: { situacao: 'rede', golpe: 'vbh', tipo: 'winner' } as any,
        }),
      ];

      const p1 = computeShotAnalysis(points, 1);
      expect(p1.netApproaches).toBe(2);
      expect(p1.netApproachesWon).toBe(1);
      expect(p1.netApproachPct).toBe(50);
    });
  });
});
