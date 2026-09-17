import { buildReportSummary } from '@/app/api/matches/[id]/report/report.summary';
import type { TimelinePoint } from '@/core/scoring/types';

function makePoint(overrides: Partial<TimelinePoint> = {}): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'ACE',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: null,
    pointDetails: {
      winnerId: 'p1',
      type: 'ACE',
      isFirstServe: true,
      isSecondServe: false,
      isLet: false,
      serverId: 'p1',
      timestamp: Date.now(),
    },
    ...overrides,
  };
}

describe('buildReportSummary', () => {
  it('deve retornar contadores zerados para lista vazia de pontos', () => {
    const summary = buildReportSummary([], null);

    expect(summary.totalPoints).toBe(0);
    expect(summary.player1.pointsWon).toBe(0);
    expect(summary.player2.pointsWon).toBe(0);
    expect(summary.sets).toEqual([]);
  });

  it('deve contar pointsWon corretamente para PLAYER_1 e PLAYER_2', () => {
    const points = [
      makePoint({ winner: 'PLAYER_1' }),
      makePoint({ winner: 'PLAYER_1' }),
      makePoint({ winner: 'PLAYER_2' }),
    ];

    const summary = buildReportSummary(points, null);

    expect(summary.totalPoints).toBe(3);
    expect(summary.player1.pointsWon).toBe(2);
    expect(summary.player2.pointsWon).toBe(1);
  });

  it('deve contar aces para o jogador que fez o ponto', () => {
    const points = [
      makePoint({ type: 'ACE', winner: 'PLAYER_1' }),
      makePoint({ type: 'ACE', winner: 'PLAYER_2' }),
      makePoint({ type: 'WINNER', winner: 'PLAYER_1' }),
    ];

    const summary = buildReportSummary(points, null);

    expect(summary.player1.aces).toBe(1);
    expect(summary.player2.aces).toBe(1);
  });

  it('deve contar double faults atribuídos ao sacador', () => {
    const points = [
      makePoint({
        type: 'DOUBLE_FAULT',
        winner: 'PLAYER_2',
        server: 'player1',
      }),
    ];

    const summary = buildReportSummary(points, null);

    expect(summary.player1.doubleFaults).toBe(1);
    expect(summary.player2.doubleFaults).toBe(0);
  });

  it('deve contar winners, forcedErrors e unforcedErrors pelo rallyDetails.tipo', () => {
    const points = [
      makePoint({
        type: 'WINNER',
        winner: 'PLAYER_1',
        rallyDetails: { tipo: 'winner', situacao: 'saque', golpe: 'saque', vencedor: 'sacador', previewBalls: 1 },
      }),
      makePoint({
        type: 'UNFORCED_ERROR',
        winner: 'PLAYER_2',
        server: 'player1',
        rallyDetails: { tipo: 'erro_forcado', situacao: 'rede', golpe: 'fh', vencedor: 'devolvedor', previewBalls: 1 },
      }),
      makePoint({
        type: 'UNFORCED_ERROR',
        winner: 'PLAYER_1',
        server: 'player2',
        rallyDetails: { tipo: 'erro_nao_forcado', situacao: 'fundo', golpe: 'bh', vencedor: 'sacador', previewBalls: 1 },
      }),
    ];

    const summary = buildReportSummary(points, null);

    expect(summary.player1.winners).toBe(1);
    expect(summary.player2.forcedErrors).toBe(0);
    expect(summary.player1.forcedErrors).toBe(1);
    expect(summary.player2.unforcedErrors).toBe(1);
  });

  it('deve contar breakPoints e breakPointsWon', () => {
    const points = [
      makePoint({
        winner: 'PLAYER_1',
        isBreakPoint: true,
      }),
      makePoint({
        winner: 'PLAYER_2',
        isBreakPoint: true,
      }),
      makePoint({
        winner: 'PLAYER_1',
        isBreakPoint: false,
      }),
    ];

    const summary = buildReportSummary(points, null);

    expect(summary.player1.breakPoints).toBe(1);
    expect(summary.player1.breakPointsWon).toBe(1);
    expect(summary.player2.breakPoints).toBe(1);
    expect(summary.player2.breakPointsWon).toBe(0);
  });

  it('deve ignorar breakPointsWon quando point.winner != PLAYER_1', () => {
    const points = [
      makePoint({
        winner: 'PLAYER_2',
        isBreakPoint: true,
      }),
    ];

    const summary = buildReportSummary(points, null);

    expect(summary.player1.breakPointsWon).toBe(0);
    expect(summary.player2.breakPointsWon).toBe(0);
  });

  it('deve extrair sets do scoreState válido', () => {
    const scoreState = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false },
        { player1: 3, player2: 6, isTiebreak: false },
      ],
    };

    const summary = buildReportSummary([], scoreState);

    expect(summary.sets).toHaveLength(2);
    expect(summary.sets[0]).toEqual({ player1: 6, player2: 4, isTiebreak: false });
    expect(summary.sets[1]).toEqual({ player1: 3, player2: 6, isTiebreak: false });
  });

  it('deve retornar sets vazios para scoreState inválido', () => {
    expect(buildReportSummary([], null).sets).toEqual([]);
    expect(buildReportSummary([], undefined).sets).toEqual([]);
    expect(buildReportSummary([], 'invalid').sets).toEqual([]);
    expect(buildReportSummary([], { sets: 'not-array' }).sets).toEqual([]);
  });

  it('deve filtrar sets com valores não numéricos', () => {
    const scoreState = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false },
        { player1: null, player2: 4, isTiebreak: false },
        { player1: 3, player2: 'invalid', isTiebreak: false },
      ],
    };

    const summary = buildReportSummary([], scoreState);

    expect(summary.sets).toHaveLength(1);
    expect(summary.sets[0]).toEqual({ player1: 6, player2: 4, isTiebreak: false });
  });

  it('deve marcar isTiebreak como true quando presente no set', () => {
    const scoreState = {
      sets: [{ player1: 7, player2: 6, isTiebreak: true }],
    };

    const summary = buildReportSummary([], scoreState);

    expect(summary.sets[0].isTiebreak).toBe(true);
  });

  it('deve ignorar entries não-objeto no array de sets', () => {
    const scoreState = {
      sets: [null, 'invalid', 42, { player1: 6, player2: 4, isTiebreak: false }],
    };

    const summary = buildReportSummary([], scoreState);

    expect(summary.sets).toHaveLength(1);
  });

  it('deve acumular múltiplos tipos de evento para o mesmo jogador', () => {
    const points = [
      makePoint({
        type: 'ACE',
        winner: 'PLAYER_1',
      }),
      makePoint({
        type: 'WINNER',
        winner: 'PLAYER_1',
        rallyDetails: { tipo: 'winner', situacao: 'saque', golpe: 'saque', vencedor: 'sacador', previewBalls: 1 },
      }),
      makePoint({
        type: 'DOUBLE_FAULT',
        winner: 'PLAYER_2',
        server: 'player1',
      }),
      makePoint({
        type: 'UNFORCED_ERROR',
        winner: 'PLAYER_2',
        server: 'player1',
        rallyDetails: { tipo: 'erro_nao_forcado', situacao: 'fundo', golpe: 'bh', vencedor: 'sacador', previewBalls: 1 },
      }),
    ];

    const summary = buildReportSummary(points, null);

    expect(summary.player1.pointsWon).toBe(2);
    expect(summary.player1.aces).toBe(1);
    expect(summary.player1.winners).toBe(1);
    expect(summary.player1.doubleFaults).toBe(1);
    expect(summary.player1.unforcedErrors).toBe(1);
  });
});
