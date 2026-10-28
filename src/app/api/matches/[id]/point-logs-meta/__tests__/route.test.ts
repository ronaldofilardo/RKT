/**
 * @jest-environment jsdom
 */
const mockPointLog = {
  findMany: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: { pointLog: mockPointLog },
}));

jest.mock('@/lib/auth', () => ({
  withRLSHandler: jest.fn(async (_req: any, _role: string, handler: Function) => {
    return await handler();
  }),
}));

jest.mock('@/lib/match-comment-access', () => ({
  withMatchCommentAccess: jest.fn((_request: any, _matchId: string, _action: string, handler: Function) => handler()),
}));

jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('@/lib/api.logic', () => ({
  reportApiError: jest.fn((_err: any) => ({
    status: 500,
    json: () => Promise.resolve({ error: 'INTERNAL_ERROR' }),
  })),
}));

jest.mock('next/server', () => {
  function MockNextResponse(body: any, init?: any) {
    const status = init?.status ?? 200;
    let parsed: any;
    try {
      parsed = typeof body === 'string' ? JSON.parse(body) : body;
    } catch {
      parsed = body;
    }
    return {
      status,
      json: jest.fn().mockImplementation(() => Promise.resolve(parsed)),
    };
  }
  MockNextResponse.json = (data: any, init?: any) =>
    MockNextResponse(JSON.stringify(data), {
      status: init?.status ?? 200,
    });
  return { NextResponse: MockNextResponse };
});

describe('GET /api/matches/[id]/point-logs-meta', () => {
  let GET: any;

  beforeAll(async () => {
    const mod = await import('../route');
    GET = mod.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consulta pointLogs com ordenação alinhada a report (sequenceNumber, timestamp, id)', async () => {
    mockPointLog.findMany.mockResolvedValue([
      { id: 'p1', audioNoteDuration: 2500, audioNoteMime: 'audio/webm' },
      { id: 'p2', audioNoteDuration: null, audioNoteMime: null },
    ]);

    const req = {
      headers: new Headers(),
      url: 'http://localhost:3000/api/matches/m1/point-logs-meta',
    } as any;
    const params = Promise.resolve({ id: 'm1' });
    const res = await GET(req, { params });
    const json = await res.json();

    expect(mockPointLog.findMany).toHaveBeenCalledWith({
      where: { matchId: 'm1', voidedAt: null },
      select: {
        id: true,
        audioNoteDuration: true,
        audioNoteMime: true,
      },
      orderBy: [
        { sequenceNumber: 'asc' },
        { timestamp: 'asc' },
        { id: 'asc' },
      ],
    });

    expect(json.pointLogs).toEqual([
      { pointLogId: 'p1', hasAudioNote: true, audioNoteDuration: 2500 },
      { pointLogId: 'p2', hasAudioNote: false, audioNoteDuration: null },
    ]);
  });
});
