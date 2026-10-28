import { NextRequest } from 'next/server';

const mockTx = {
  match: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  pointLog: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn().mockResolvedValue({ _max: { sequenceNumber: 1 } }),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((cb: Function) => cb(mockTx)),
  },
}));

jest.mock('@/services/accessService', () => ({
  getActor: jest.fn().mockResolvedValue({
    userId: 'user-ath',
    isActive: true,
    canOperate: true,
    memberships: [],
    athletePlayerId: 'cjs5nqpr7000001l29u6qr9f1',
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
  }),
  invalidateActor: jest.fn(),
  bumpSessionVersion: jest.fn(),
}));

const P1_ID = 'cjs5nqpr7000001l29u6qr9f1';
const P2_ID = 'cjs5nqpr7000001l29u6qr9f2';

const mockEngineInstance = {
  applyPoint: jest.fn().mockReturnValue({
    sets: [],
    currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  }),
  isFinished: jest.fn().mockReturnValue(false),
  getServer: jest.fn().mockReturnValue('player1'),
  getState: jest.fn().mockReturnValue({
    sets: [],
    currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  }),
  serialize: jest.fn().mockReturnValue(JSON.stringify({ state: {}, history: [] })),
  getPointHistory: jest.fn().mockReturnValue([]),
  getHistoryLength: jest.fn().mockReturnValue(0),
  restorePointHistory: jest.fn(),
};

const MockScoringEngine: any = jest.fn().mockImplementation(() => mockEngineInstance);
MockScoringEngine.fromSerialized = jest.fn().mockReturnValue(mockEngineInstance);

jest.mock('@/core/scoring/engine', () => ({
  ScoringEngine: MockScoringEngine,
}));

const ANNOTATOR_HEADERS = {
  'x-user-id': 'user-ath',
  'x-user-role': 'ANNOTATOR',
};

describe('POST /api/matches/[id]/point - Client timestamp validation (D3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTx.pointLog.aggregate.mockResolvedValue({ _max: { sequenceNumber: 1 } });
    mockTx.pointLog.create.mockImplementation((args: any) => ({
      id: 'pt-1',
      ...args.data,
    }));
    mockTx.match.findFirst.mockResolvedValue({
      id: 'match-1',
      format: 'BEST_OF_3',
      state: 'IN_PROGRESS',
      initialServerId: P1_ID,
      player1Id: P1_ID,
      player2Id: P2_ID,
      player1: { id: P1_ID },
      player2: { id: P2_ID },
      version: 1,
      startedAt: new Date(1000000),
      createdAt: new Date(1000000),
      openForAnnotation: true,
      scoreState: {
        state: {
          sets: [],
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
        },
        history: [],
      },
    });
  });

  it('preserves valid client timestamp on point log', async () => {
    const clientTimestamp = Date.now() - 5000;
    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: P1_ID,
        type: 'WINNER',
        serverId: P1_ID,
        timestamp: clientTimestamp,
      }),
      headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const res = await mod.POST(req, { params: Promise.resolve({ id: 'match-1' }) });

    expect(res.status).toBe(200);
    expect(mockTx.pointLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          timestamp: new Date(clientTimestamp),
        }),
      })
    );
  });

  it('clamps future client timestamp exceeding drift limit to now', async () => {
    const farFutureTimestamp = Date.now() + 10 * 60 * 1000; // +10 min
    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: P1_ID,
        type: 'WINNER',
        serverId: P1_ID,
        timestamp: farFutureTimestamp,
      }),
      headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
    });

    const beforeCall = Date.now();
    const mod = await import('@/app/api/matches/[id]/point/route');
    const res = await mod.POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const afterCall = Date.now();

    expect(res.status).toBe(200);
    const createdTimestamp = mockTx.pointLog.create.mock.calls[0][0].data.timestamp.getTime();
    expect(createdTimestamp).toBeGreaterThanOrEqual(beforeCall);
    expect(createdTimestamp).toBeLessThanOrEqual(afterCall);
  });
});
