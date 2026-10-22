jest.mock('@/lib/prisma', () => {
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
});

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const mockPrisma = prisma as any;

const SERVE_ORDER = {
  player1: ['p1', 'p1-partner'],
  player2: ['p2', 'p2-partner'],
} as const;

const RECEIVE_DEUCE = { player1: 'p1-partner', player2: 'p2-partner' } as const;

const CHANGE_AFTER_SET_0 = {
  afterSet: 0,
  serveOrder: { player1: ['p1-partner', 'p1'], player2: ['p2-partner', 'p2'] },
  receiveDeuce: { player1: 'p1', player2: 'p2' },
};

const CHANGE_AFTER_SET_1 = {
  afterSet: 1,
  serveOrder: { player1: ['p1', 'p1-partner'], player2: ['p2-partner', 'p2'] },
  receiveDeuce: { player1: 'p2', player2: 'p1' },
};

const COMPLETED_SET = { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null };
const OPEN_SET = { player1: 4, player2: 3, isTiebreak: false, tiebreakScore: null };

function doublesSetup(changes: unknown[] = [CHANGE_AFTER_SET_0, CHANGE_AFTER_SET_1]) {
  return { serveOrder: SERVE_ORDER, receiveDeuce: RECEIVE_DEUCE, changes };
}

function baseMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    state: 'IN_PROGRESS',
    matchType: 'DOUBLES',
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player1PartnerId: 'p1-partner',
    player2Id: 'p2',
    player2PartnerId: 'p2-partner',
    initialServerId: 'p1',
    version: 5,
    scoreState: null,
    doublesSetup: doublesSetup(),
    ...overrides,
  };
}

function undoOptions(overrides: Record<string, unknown> = {}) {
  return { allowScoreEdit: true, expectedVersion: 5, isUndo: true, ...overrides };
}

function updateData() {
  return mockPrisma.match.update.mock.calls[0][0].data;
}

async function runUndo(
  match: Record<string, unknown>,
  targetScoreState: unknown,
  options?: Record<string, unknown>,
) {
  const { transitionMatchState } = await import('@/services/matchService');
  mockPrisma.match.findFirst.mockResolvedValue(match);
  mockPrisma.match.update.mockResolvedValue({ id: 'm1', version: 6 });
  return transitionMatchState('m1', 'IN_PROGRESS', undefined, targetScoreState, options as any);
}

describe('matchService.transitionMatchState - caracterização doublesSetup no undo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('recorta changes posteriores ao conjunto completo do estado-alvo', async () => {
    const result = await runUndo(baseMatch(), { sets: [COMPLETED_SET] }, undoOptions());

    expect(result).toEqual({ id: 'm1', version: 6 });
    const data = updateData();
    expect(data.doublesSetup.changes).toEqual([CHANGE_AFTER_SET_0]);
    expect(data.doublesSetup.serveOrder).toEqual(SERVE_ORDER);
    expect(data.doublesSetup.receiveDeuce).toEqual(RECEIVE_DEUCE);
  });

  it('descarta todos os changes quando o alvo volta para 0 sets completos', async () => {
    await runUndo(baseMatch(), { sets: [OPEN_SET] }, undoOptions());

    expect(updateData().doublesSetup.changes).toEqual([]);
  });

  it('mantém todos os changes quando todos antecedem o conjunto-alvo', async () => {
    await runUndo(baseMatch(), { sets: [COMPLETED_SET, COMPLETED_SET] }, undoOptions());

    expect(updateData().doublesSetup.changes).toEqual([
      CHANGE_AFTER_SET_0,
      CHANGE_AFTER_SET_1,
    ]);
  });

  it('desembrulha envelope { state } do estado-alvo antes de contar sets', async () => {
    await runUndo(baseMatch(), { state: { sets: [COMPLETED_SET] } }, undoOptions());

    expect(updateData().doublesSetup.changes).toEqual([CHANGE_AFTER_SET_0]);
  });

  it('conta super-tiebreak como conjunto completo ao podar changes', async () => {
    await runUndo(
      baseMatch(),
      { sets: [{ player1: 6, player2: 7, isTiebreak: true, tiebreakScore: 10 }] },
      undoOptions(),
    );

    expect(updateData().doublesSetup.changes).toEqual([CHANGE_AFTER_SET_0]);
  });

  it('aceita estado-alvo serializado como string JSON', async () => {
    await runUndo(
      baseMatch(),
      JSON.stringify({ sets: [COMPLETED_SET] }),
      undoOptions(),
    );

    expect(updateData().doublesSetup.changes).toEqual([CHANGE_AFTER_SET_0]);
  });

  it('não altera doublesSetup quando a transição não é undo', async () => {
    await runUndo(
      baseMatch(),
      { sets: [COMPLETED_SET] },
      { allowScoreEdit: true, expectedVersion: 5 },
    );

    expect(updateData().doublesSetup.changes).toEqual([
      CHANGE_AFTER_SET_0,
      CHANGE_AFTER_SET_1,
    ]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('não escreve doublesSetup em partidas SINGLES', async () => {
    await runUndo(
      baseMatch({
        matchType: 'SINGLES',
        player1PartnerId: null,
        player2PartnerId: null,
        doublesSetup: null,
      }),
      { sets: [COMPLETED_SET] },
      undoOptions(),
    );

    expect(updateData().doublesSetup).toBeUndefined();
  });

  it('ignora doublesSetup sem changes e não registra warn', async () => {
    await runUndo(
      baseMatch({ doublesSetup: doublesSetup([]) }),
      { sets: [COMPLETED_SET] },
      undoOptions(),
    );

    expect(updateData().doublesSetup.changes).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('registra warn e mantém a atualização quando doublesSetup é JSON malformado', async () => {
    await runUndo(
      baseMatch({ doublesSetup: '{broken-json' }),
      { sets: [COMPLETED_SET] },
      undoOptions({ doublesSetup: doublesSetup() }),
    );

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(String((logger.warn as jest.Mock).mock.calls[0][0])).toContain(
      '[transitionMatchState] Falha ao ajustar doublesSetup.changes no undo',
    );
    expect(updateData().doublesSetup.changes).toEqual([
      CHANGE_AFTER_SET_0,
      CHANGE_AFTER_SET_1,
    ]);
    expect(mockPrisma.match.update).toHaveBeenCalledTimes(1);
  });
});
