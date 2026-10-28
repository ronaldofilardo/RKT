import { NextRequest } from 'next/server';
import { makeAuthHeaders } from '@/test-helpers/auth';
import { buildAnnotationsPayload } from '../point/route.logic';
import { buildPointPayload } from '@/core/scoring/point-payload';
import type { PointFlow } from '@/core/scoring/types';

const mockTx = {
  match: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  pointLog: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((cb: Function) => cb(mockTx)),
    match: {
      findFirst: jest.fn((...args: unknown[]) => mockTx.match.findFirst(...args)),
      findUnique: jest.fn((...args: unknown[]) => mockTx.match.findUnique(...args)),
    },
    pointLog: {
      findMany: jest.fn((...args: unknown[]) => mockTx.pointLog.findMany(...args)),
      findFirst: jest.fn((...args: unknown[]) => mockTx.pointLog.findFirst(...args)),
      count: jest.fn((...args: unknown[]) => mockTx.pointLog.count(...args)),
    },
    matchComment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('@/services/accessService', () => ({
  getActor: jest.fn().mockResolvedValue({
    userId: 'user-annotator-1',
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

let ANNOTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ANNOTATOR_HEADERS = await makeAuthHeaders('user-annotator-1', 'ANNOTATOR');
});

describe('Round-trip de gravação de ponto (Fase A4)', () => {
  const p1Id = 'cjs5nqpr7000001l29u6qr9f1';
  const p2Id = 'cjs5nqpr7000001l29u6qr9f2';
  const matchId = 'cjs5nqpr7000001l29u6qr9m1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx.pointLog.aggregate.mockResolvedValue({ _max: { sequenceNumber: 0 } });
  });

  it('grava ponto completo com rallyDetails, firstFaultDetail, note e clientEventId sem perda de dados', async () => {
    const initialScoreState = {
      state: {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      },
      history: [],
    };

    mockTx.match.findFirst.mockResolvedValue({
      id: matchId,
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: p1Id,
      player2Id: p2Id,
      initialServerId: p1Id,
      version: 1,
      createdAt: new Date(),
      startedAt: new Date(),
      scoreState: initialScoreState,
      player1: { id: p1Id, name: 'Atleta Um' },
      player2: { id: p2Id, name: 'Atleta Dois' },
      openForAnnotation: true,
    });

    mockTx.pointLog.findFirst.mockResolvedValue(null);
    mockTx.pointLog.create.mockImplementation((args: any) => ({
      id: 'pl-created-1',
      ...args.data,
    }));
    mockTx.match.update.mockResolvedValue({ id: matchId, version: 2 });

    const flow: PointFlow = {
      winnerId: p1Id,
      type: 'WINNER',
      serverId: p1Id,
      timestamp: Date.now(),
      isFirstServe: false,
      isSecondServe: true,
      rallyLength: 6,
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        direcao: 'paralela',
        efeito: 'topspin',
        previewBalls: 6,
        note: 'Ponto espetacular na paralela',
      },
      firstFaultDetail: {
        errorType: 'net',
        direction: 'centro',
      },
      clientEventId: 'evt-roundtrip-test-001',
    };

    const payload = buildPointPayload(flow, 1, flow.clientEventId);

    const pointReq = new NextRequest(`http://localhost:3000/api/matches/${matchId}/point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      body: JSON.stringify(payload),
    });

    const pointModule = await import('@/app/api/matches/[id]/point/route');
    const pointRes = await pointModule.POST(pointReq, { params: Promise.resolve({ id: matchId }) });

    expect(pointRes.status).toBe(200);
    const pointBody = await pointRes.json();
    expect(pointBody.pointLogId).toBe('pl-created-1');
    expect(pointBody.version).toBe(2);

    // Valida o que foi persistido no Prisma pointLog.create
    expect(mockTx.pointLog.create).toHaveBeenCalledTimes(1);
    const createdCall = mockTx.pointLog.create.mock.calls[0][0];
    expect(createdCall.data).toEqual(
      expect.objectContaining({
        matchId,
        winnerId: p1Id,
        serverId: p1Id,
        type: 'WINNER',
        clientEventId: 'evt-roundtrip-test-001',
        sequenceNumber: 1,
      }),
    );

    const savedAnnotations = createdCall.data.annotations;
    expect(savedAnnotations).toBeDefined();
    expect(savedAnnotations.isFirstServe).toBe(false);
    expect(savedAnnotations.isSecondServe).toBe(true);
    expect(savedAnnotations.rallyLength).toBe(6);
    expect(savedAnnotations.note).toBe('Ponto espetacular na paralela');
    expect(savedAnnotations.firstFaultDetail).toEqual({
      errorType: 'net',
      direction: 'centro',
    });
    expect(savedAnnotations.rallyDetails).toEqual(flow.rallyDetails);
  });

  it('annotations payload builder preserva todas as anotações do contrato de ponto', () => {
    const rawInput = {
      winnerId: p1Id,
      type: 'WINNER' as const,
      serverId: p1Id,
      isFirstServe: false,
      isSecondServe: true,
      rallyLength: 3,
      rallyDetails: {
        vencedor: 'sacador' as const,
        situacao: 'rede' as const,
        tipo: 'winner' as const,
        golpe: 'vfh' as const,
        previewBalls: 3,
        note: 'Voleio curto angulado',
      },
      firstFaultDetail: { errorType: 'out' },
    };

    const annotations = buildAnnotationsPayload(rawInput);
    expect(annotations.rallyDetails).toEqual(rawInput.rallyDetails);
    expect(annotations.rallyLength).toBe(3);
    expect(annotations.note).toBe('Voleio curto angulado');
    expect(annotations.firstFaultDetail).toEqual({ errorType: 'out' });
    expect(annotations.isFirstServe).toBe(false);
    expect(annotations.isSecondServe).toBe(true);
  });
});
