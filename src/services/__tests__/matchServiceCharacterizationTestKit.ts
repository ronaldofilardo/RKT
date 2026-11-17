/**
 * Kit de testes de matchService.characterization.test.ts (não é .test.ts:
 * fica fora da coleta do Jest e não é limitado a 80L). Concentra o arrange:
 * - mockPrismaModule(): factory do jest.mock('@/lib/prisma') — mock EXATO do
 *   original (tx compartilhado match.update, $transaction aceitando callback
 *   ou array, e __txMock exposto);
 * - PLAYER_1/PLAYER_2/baseCreatedMatch e matchRow(): linha padrão com spread;
 * - fixtures de create/delete/finish usadas pelos splits.
 *
 * NOTA (TD-001): a suíte original migrou de DB real para mocks do Prisma em
 * 2026-07-25; os comportamentos caracterizados não mudaram, apenas o I/O.
 */

export function mockPrismaModule() {
  const txUpdate = jest.fn();
  const txMock = {
    match: {
      create: jest.fn(),
      update: txUpdate,
    },
    matchScoreEdit: {
      create: jest.fn(),
    },
  };
  const prismaMock = {
    match: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: txUpdate,
      delete: jest.fn(),
    },
    pointLog: {
      deleteMany: jest.fn(),
    },
    matchAnnotationSession: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((arg: any) => {
      // Suporta tanto callback (`async (tx) => ...`) quanto array de ops.
      if (typeof arg === 'function') return arg(txMock);
      return Promise.all(arg);
    }),
    __txMock: txMock,
  };
  return { prisma: prismaMock };
}

export const PLAYER_1 = { id: 'p1', name: 'Player 1' };
export const PLAYER_2 = { id: 'p2', name: 'Player 2' };

export const baseCreatedMatch = {
  id: 'match-1',
  state: 'SCHEDULED',
  format: 'BEST_OF_3',
  sportType: 'TENNIS',
  courtType: null,
  nickname: null,
  visibility: 'PUBLIC',
  openForAnnotation: false,
  tournamentName: null,
  category: null,
  round: null,
  bracketType: null,
  temperature: null,
  humidity: null,
  player1Id: PLAYER_1.id,
  player2Id: PLAYER_2.id,
  initialServerId: null,
  scoreState: null,
  player1: PLAYER_1,
  player2: PLAYER_2,
};

/** baseCreatedMatch com overrides (linha retornada pelos mocks do service). */
export function matchRow(overrides: Record<string, unknown> = {}) {
  return { ...baseCreatedMatch, ...overrides };
}

/** Linha findFirst de deleteMatch (só id/state + relações vazias). */
export function deleteRow(overrides: Record<string, unknown> = {}) {
  return { id: 'match-1', state: 'SCHEDULED', pointLog: [], annotationSessions: [], ...overrides };
}

/** Payload completo de createMatch com todos os campos opcionais. */
export function fullCreateInput() {
  return {
    player1Id: PLAYER_1.id,
    player2Id: PLAYER_2.id,
    format: 'BEST_OF_3',
    sportType: 'TENNIS',
    courtType: 'Saibro',
    nickname: 'Partida Amistosa',
    visibility: 'PRIVATE',
    openForAnnotation: true,
    scheduledAt: new Date('2026-08-01T10:00:00Z'),
    tournamentName: 'Torneio de Verão',
    category: 'Amador',
    round: 'QF',
    roundName: 'Quartas de final',
    bracketType: 'SINGLE_ELIMINATION',
    temperature: 25.5,
    humidity: 60,
  };
}

/** Resultado do create quando todos os opcionais foram enviados. */
export function fullCreatedMatch() {
  return matchRow({
    id: 'match-opt',
    courtType: 'Saibro',
    nickname: 'Partida Amistosa',
    visibility: 'PRIVATE',
    openForAnnotation: true,
    tournamentName: 'Torneio de Verão',
  });
}

/** scoreState completo de partida encerrada (usado em finish/transition). */
export function finishedScoreState() {
  return {
    sets: [{ player1: 6, player2: 4 }, { player1: 6, player2: 4 }],
    setsWon: { player1: 2, player2: 0 },
    isFinished: true,
    winner: 'player1',
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    startedAt: null,
    secondServe: false,
  };
}

/** Motor mockado para jest.spyOn(ScoringEngine, 'fromSerialized'). */
export function mockFinishedEngine() {
  return {
    isFinished: jest.fn().mockReturnValue(true),
    getWinner: jest.fn().mockReturnValue('player1'),
  };
}
