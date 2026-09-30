import type { TimelinePoint } from '@/core/scoring/types';
import { computeSetBreakdown } from '../momentum-set-stats';
import { computeCompletedGames, computeServeStats, computeReturnStats } from '../serve-return-stats';

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
    rallyLength: 1,
    rallyDetails: null,
    ...overrides,
  };
}

describe('momentum-set-stats & game tracking', () => {
  it('atribui placar correto de games (ex: 6x4) no término do set no computeSetBreakdown', () => {
    // Simulando 2 games no set 1:
    // Game 1 (P1 vence): pontos 1 a 4 (gamesScore 0-0 no stateBefore)
    // Game 2 (P2 vence): pontos 5 a 8 (gamesScore 1-0 no stateBefore)
    // Ponto 9 inicia o set 2: gamesScore 0-0, setNumber: 2
    const points: TimelinePoint[] = [
      // Game 1 vencido por P1
      createMockPoint({ pointNumber: 1, setNumber: 1, gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 2, setNumber: 1, gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 3, setNumber: 1, gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 4, setNumber: 1, gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1', isGameBall: true }),
      // Game 2 vencido por P2 (que fecha o set simulado em 1x1)
      createMockPoint({ pointNumber: 5, setNumber: 1, gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2' }),
      createMockPoint({ pointNumber: 6, setNumber: 1, gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2' }),
      createMockPoint({ pointNumber: 7, setNumber: 1, gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2' }),
      createMockPoint({ pointNumber: 8, setNumber: 1, gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2', isSetBall: true }),
      // Set 2 inicia
      createMockPoint({ pointNumber: 9, setNumber: 2, gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
    ];

    const breakdown = computeSetBreakdown(points);
    expect(breakdown.length).toBe(2);

    // Set 1: P1 venceu 1 game, P2 venceu 1 game
    expect(breakdown[0].setNumber).toBe(1);
    expect(breakdown[0].p1Games).toBe(1);
    expect(breakdown[0].p2Games).toBe(1);
  });

  it('conta winners e erros no SetBreakdown mesmo quando rallyDetails não é preenchido', () => {
    const points: TimelinePoint[] = [
      createMockPoint({ pointNumber: 1, type: 'WINNER', winner: 'PLAYER_1', rallyDetails: null }),
      createMockPoint({ pointNumber: 2, type: 'UNFORCED_ERROR', winner: 'PLAYER_2', rallyDetails: null }), // P1 errou
      createMockPoint({ pointNumber: 3, type: 'FORCED_ERROR', winner: 'PLAYER_1', rallyDetails: null }),   // P2 errou
      createMockPoint({ pointNumber: 4, type: 'WINNER', winner: 'PLAYER_2', rallyDetails: null }),
    ];

    const breakdown = computeSetBreakdown(points);
    expect(breakdown[0].p1Winners).toBe(1);
    expect(breakdown[0].p2Winners).toBe(1);
    expect(breakdown[0].p1Errors).toBe(1); // P1 cometeu o erro do ponto 2
    expect(breakdown[0].p2Errors).toBe(1); // P2 cometeu o erro do ponto 3
  });

  it('não perde o último game do set anterior em computeCompletedGames quando set muda', () => {
    // 2 games no Set 1:
    // Game 1: P1 saca, vence
    // Game 2: P2 saca, P1 quebra e fecha o set (Set 1 fecha em 2x0)
    // Game 1 do Set 2 começa no ponto 9
    const points: TimelinePoint[] = [
      // Game 1
      createMockPoint({ pointNumber: 1, setNumber: 1, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 2, setNumber: 1, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 3, setNumber: 1, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 4, setNumber: 1, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      // Game 2 (que fecha o Set 1)
      createMockPoint({ pointNumber: 5, setNumber: 1, server: 'player2', gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 6, setNumber: 1, server: 'player2', gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 7, setNumber: 1, server: 'player2', gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 8, setNumber: 1, server: 'player2', gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_1' }),
      // Ponto do Set 2
      createMockPoint({ pointNumber: 9, setNumber: 2, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
    ];

    const completed = computeCompletedGames(points);
    // Deve conter Game 1 do Set 1, Game 2 do Set 1, e o game aberto do Set 2
    expect(completed.filter(g => g.setNumber === 1).length).toBe(2);

    const serveStatsP2 = computeServeStats(points, 2);
    // P2 sacou no game 2 do set 1 e foi quebrado
    expect(serveStatsP2.serviceGamesPlayed).toBe(1);
    expect(serveStatsP2.serviceGamesWon).toBe(0);

    const returnStatsP1 = computeReturnStats(points, 1);
    // P1 retornou no game 2 do set 1 e quebrou
    expect(returnStatsP1.returnGamesPlayed).toBe(1);
    expect(returnStatsP1.returnGamesWon).toBe(1);
  });

  it('não multiplica pontos de tiebreak em games falsos', () => {
    // Tiebreak com 6 pontos
    const points: TimelinePoint[] = [
      createMockPoint({ pointNumber: 1, isTiebreak: true, setNumber: 1, gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 2, isTiebreak: true, setNumber: 1, gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2' }),
      createMockPoint({ pointNumber: 3, isTiebreak: true, setNumber: 1, gamesScore: { player1: 1, player2: 1 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 4, isTiebreak: true, setNumber: 1, gamesScore: { player1: 2, player2: 1 }, winner: 'PLAYER_2' }),
      createMockPoint({ pointNumber: 5, isTiebreak: true, setNumber: 1, gamesScore: { player1: 2, player2: 2 }, winner: 'PLAYER_1' }),
      createMockPoint({ pointNumber: 6, isTiebreak: true, setNumber: 1, gamesScore: { player1: 3, player2: 2 }, winner: 'PLAYER_1' }),
    ];

    const completed = computeCompletedGames(points);
    // Deve ter apenas 1 game (o tiebreak em si), que é isTiebreak = true
    expect(completed.length).toBe(1);
    expect(completed[0].isTiebreak).toBe(true);

    // E não deve contar como service game comum
    const serveStats = computeServeStats(points, 1);
    expect(serveStats.serviceGamesPlayed).toBe(0);
  });
});
