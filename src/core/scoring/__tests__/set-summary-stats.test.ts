import { computeSetSummary, computeGameErrors } from '../set-summary-stats';
import type { TimelinePoint } from '../types';

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
    rallyDetails: {
      tipo: 'winner',
      golpe: 'fh',
      lado: 'd',
      situacao: 'fundo',
      subtipo: 'paralela',
    },
    pointDetails: {
      server: 'player1',
      receiver: 'player2',
      winner: 'player1',
      isFirstServe: true,
      isSecondServe: false,
      isAce: false,
      isDoubleFault: false,
      isWinner: true,
      isForcedError: false,
      isUnforcedError: false,
      scoreBefore: {
        player1: '0',
        player2: '0',
        gameScore: { player1: 0, player2: 0 },
        setScore: { player1: 0, player2: 0 },
        sets: [],
        server: 'player1',
        isTiebreak: false,
      },
      scoreAfter: {
        player1: '15',
        player2: '0',
        gameScore: { player1: 1, player2: 0 },
        setScore: { player1: 0, player2: 0 },
        sets: [],
        server: 'player1',
        isTiebreak: false,
      },
    },
    ...overrides,
  };
}

describe('set-summary-stats', () => {
  it('calcula estatísticas de saque e devolução corretamente para o Set 1', () => {
    const points: TimelinePoint[] = [
      // P1 sacando
      createMockPoint({ pointNumber: 1, server: 'player1', type: 'ACE', winner: 'PLAYER_1', isFirstServe: true, isSecondServe: false }),
      createMockPoint({ pointNumber: 2, server: 'player1', type: 'UNFORCED_ERROR', winner: 'PLAYER_2', isFirstServe: false, isSecondServe: true }),
      createMockPoint({ pointNumber: 3, server: 'player1', type: 'DOUBLE_FAULT', winner: 'PLAYER_2', isFirstServe: false, isSecondServe: true }),
      createMockPoint({ pointNumber: 4, server: 'player1', type: 'WINNER', winner: 'PLAYER_1', isFirstServe: true, isSecondServe: false }),
      
      // P2 sacando com Break Point para P1
      createMockPoint({
        pointNumber: 5,
        server: 'player2',
        type: 'WINNER',
        winner: 'PLAYER_1',
        isBreakPoint: true,
        isFirstServe: true,
        gamesScore: { player1: 1, player2: 0 },
      }),
    ];

    const summary = computeSetSummary(points, 1);

    expect(summary.setNumber).toBe(1);
    expect(summary.totalPoints).toBe(5);

    // P1 sacou 4 pontos: 2 de primeiro saque (pts 1 e 4), 2 de segundo saque (pts 2 e 3)
    expect(summary.player1.totalServicePoints).toBe(4);
    expect(summary.player1.firstServesIn).toBe(2);
    expect(summary.player1.firstServePct).toBe(50);
    expect(summary.player1.firstServePointsWon).toBe(2);
    expect(summary.player1.firstServePointsWonPct).toBe(100);
    expect(summary.player1.aces).toBe(1);
    expect(summary.player1.doubleFaults).toBe(1);

    // P1 como devolvedor no ponto 5 converteu 1 break point
    expect(summary.player1.breakPointsOpportunities).toBe(1);
    expect(summary.player1.breakPointsConverted).toBe(1);
    expect(summary.player1.breakPointsConvertedPct).toBe(100);

    // P2 enfrentou 1 break point e perdeu
    expect(summary.player2.breakPointsFaced).toBe(1);
    expect(summary.player2.breakPointsSaved).toBe(0);
    expect(summary.player2.breakPointsSavedPct).toBe(0);
  });

  it('agrupa erros cronológicos por game (histograma)', () => {
    const points: TimelinePoint[] = [
      // Game 1 (P1 saca, gamesScore 0-0 -> fecha em 1-0)
      createMockPoint({ pointNumber: 1, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1', type: 'UNFORCED_ERROR', rallyDetails: { tipo: 'erro_nao_forcado', golpe: 'bh', lado: 'e', situacao: 'fundo' } }), // erro P2
      createMockPoint({ pointNumber: 2, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_2', type: 'FORCED_ERROR', rallyDetails: { tipo: 'erro_forcado', golpe: 'fh', lado: 'd', situacao: 'rede' } }), // erro P1
      createMockPoint({ pointNumber: 3, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1', type: 'ACE' }),
      createMockPoint({ pointNumber: 4, server: 'player1', gamesScore: { player1: 0, player2: 0 }, winner: 'PLAYER_1', type: 'WINNER' }), // Fim do Game 1

      // Game 2 (P2 saca, gamesScore 1-0 -> fecha em 1-1)
      createMockPoint({ pointNumber: 5, server: 'player2', gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2', type: 'UNFORCED_ERROR', rallyDetails: { tipo: 'erro_nao_forcado', golpe: 'fh', lado: 'd', situacao: 'fundo' } }), // erro P1
      createMockPoint({ pointNumber: 6, server: 'player2', gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2', type: 'UNFORCED_ERROR', rallyDetails: { tipo: 'erro_nao_forcado', golpe: 'bh', lado: 'e', situacao: 'fundo' } }), // erro P1
      createMockPoint({ pointNumber: 7, server: 'player2', gamesScore: { player1: 1, player2: 0 }, winner: 'PLAYER_2', type: 'ACE' }), // Fim do Game 2
    ];

    const gameErrors = computeGameErrors(points);

    expect(gameErrors).toHaveLength(2);

    // Game 1
    expect(gameErrors[0].gameIndex).toBe(1);
    expect(gameErrors[0].server).toBe('player1');
    expect(gameErrors[0].winner).toBe('player1');
    expect(gameErrors[0].scoreLabel).toBe('1-0');
    expect(gameErrors[0].p1Errors.forced).toBe(1);
    expect(gameErrors[0].p1Errors.total).toBe(1);
    expect(gameErrors[0].p2Errors.unforced).toBe(1);
    expect(gameErrors[0].p2Errors.total).toBe(1);

    // Game 2
    expect(gameErrors[1].gameIndex).toBe(2);
    expect(gameErrors[1].server).toBe('player2');
    expect(gameErrors[1].winner).toBe('player2');
    expect(gameErrors[1].scoreLabel).toBe('1-1');
    expect(gameErrors[1].p1Errors.unforced).toBe(2);
    expect(gameErrors[1].p1Errors.total).toBe(2);
    expect(gameErrors[1].p2Errors.total).toBe(0);
  });

  it('isola pontos apenas do set selecionado', () => {
    const points: TimelinePoint[] = [
      createMockPoint({ pointNumber: 1, setNumber: 1, winner: 'PLAYER_1', type: 'ACE', server: 'player1' }),
      createMockPoint({ pointNumber: 2, setNumber: 1, winner: 'PLAYER_1', type: 'ACE', server: 'player1' }),
      createMockPoint({ pointNumber: 3, setNumber: 2, winner: 'PLAYER_2', type: 'ACE', server: 'player2' }),
    ];

    const summarySet1 = computeSetSummary(points, 1);
    expect(summarySet1.totalPoints).toBe(2);
    expect(summarySet1.player1.aces).toBe(2);
    expect(summarySet1.player2.aces).toBe(0);

    const summarySet2 = computeSetSummary(points, 2);
    expect(summarySet2.totalPoints).toBe(1);
    expect(summarySet2.player1.aces).toBe(0);
    expect(summarySet2.player2.aces).toBe(1);
  });
});
