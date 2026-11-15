/**
 * Kit de teste compartilhado pelos arquivos matchService.*.test.ts.
 * Fora da coleta do Jest (nao termina em .test.ts).
 */

export function createPrismaMock() {
  const matchUpdate = jest.fn();
  const pointLogUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
  const pointLogFindFirst = jest.fn();
  const pointLogUpdate = jest.fn();
  const match = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: matchUpdate,
    delete: jest.fn(),
  };
  return {
    prisma: {
      match,
      pointLog: {
        deleteMany: jest.fn(),
        updateMany: pointLogUpdateMany,
        findFirst: pointLogFindFirst,
        update: pointLogUpdate,
      },
      matchAnnotationSession: { findFirst: jest.fn(), deleteMany: jest.fn() },
      $transaction: jest.fn((operation: unknown) => {
        if (typeof operation === 'function') {
          return operation({
            match: { update: matchUpdate },
            matchScoreEdit: { create: jest.fn().mockResolvedValue({ id: 'edit-1' }) },
            pointLog: {
              updateMany: pointLogUpdateMany,
              findFirst: pointLogFindFirst,
              update: pointLogUpdate,
            },
          });
        }
        return Promise.all(operation as Promise<unknown>[]);
      }),
    },
  };
}

export function resolveCreateWithInputData(args: any) {
  return Promise.resolve({ id: 'new', ...args.data });
}

export function scoreState(overrides: Record<string, unknown> = {}) {
  return {
    sets: [],
    setsWon: { player1: 0, player2: 0 },
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    startedAt: null,
    secondServe: false,
    ...overrides,
  };
}

export function game(player1: number, player2: number, extras: Record<string, unknown> = {}) {
  return { player1, player2, isDeuce: false, advantage: null, secondServe: false, ...extras };
}

export function set(player1: number, player2: number) {
  return { player1, player2, isTiebreak: false, tiebreakScore: null };
}

export function tbSet(tiebreakPlayer1: number, tiebreakPlayer2: number) {
  return {
    player1: 0,
    player2: 0,
    isTiebreak: true,
    tiebreakScore: { player1: tiebreakPlayer1, player2: tiebreakPlayer2 },
  };
}

export function matchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    state: 'IN_PROGRESS',
    player1Id: 'p1',
    player2Id: 'p2',
    format: 'BEST_OF_3',
    initialServerId: 'p1',
    ...overrides,
  };
}

export function createMatchInput(overrides: Record<string, unknown> = {}) {
  return { player1Id: 'p1', player2Id: 'p2', format: 'BEST_OF_3', ...overrides };
}
