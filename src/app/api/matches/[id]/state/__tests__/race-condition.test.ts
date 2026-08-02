/**
 * Testes de race condition para PATCH /api/matches/[id]/state (optimistic locking).
 *
 * Cobre:
 *  - Dois PATCHs concorrentes com o mesmo `version` esperado: apenas 1
 *    completa com 200, o segundo recebe 409 VERSION_CONFLICT.
 *  - Verifica que `transitionMatchState` foi chamado com `expectedVersion`
 *    vindo do body.
 *  - Verifica que retorna 404 quando `transitionMatchState` retorna null.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PATCH } from '@/app/api/matches/[id]/state/route';
import { prisma } from '@/lib/prisma';
import { transitionMatchState } from '@/services/matchService';
import { makeAuthHeaders } from '@/test-helpers/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/services/matchService', () => ({
  transitionMatchState: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockTransition = transitionMatchState as jest.MockedFunction<typeof transitionMatchState>;
const mockFindUnique = mockPrisma.match.findUnique as jest.Mock;

let ATHLETE_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ATHLETE_HEADERS = await makeAuthHeaders('user-123', 'ATHLETE');
});

function makeRequest(id: string, body: any) {
  return new NextRequest(`http://localhost:3000/api/matches/${id}/state`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...ATHLETE_HEADERS,
    },
    body: JSON.stringify(body),
  });
}

async function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/matches/[id]/state — race condition (optimistic locking)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('primeiro PATCH com version=1 completa com 200; segundo (mesma version) recebe 409', async () => {
    mockTransition
      .mockResolvedValueOnce({
        id: 'm-1',
        state: 'IN_PROGRESS',
        version: 2,
        player1: { id: 'p1', name: 'P1' },
        player2: { id: 'p2', name: 'P2' },
      } as any)
      .mockResolvedValueOnce({ error: 'VERSION_CONFLICT' } as any);

    mockFindUnique.mockResolvedValue({ version: 2 });

    const body = {
      state: 'IN_PROGRESS',
      version: 1,
      initialServerId: 'p1',
    };

    const [r1, r2] = await Promise.all([
      PATCH(makeRequest('m-1', body), await params('m-1')),
      PATCH(makeRequest('m-1', body), await params('m-1')),
    ]);

    expect(r1.status).toBe(200);
    const b1 = await r1.json();
    expect(b1.version).toBe(2);

    expect(r2.status).toBe(409);
    const b2 = await r2.json();
    expect(b2.error).toBe('VERSION_CONFLICT');
    expect(b2.currentVersion).toBe(2);
    expect(b2.expectedVersion).toBe(1);
  });

  it('transitionMatchState deve receber expectedVersion vindo do body', async () => {
    mockTransition.mockResolvedValueOnce({
      id: 'm-1',
      state: 'FINISHED',
      version: 5,
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
    } as any);

    const req = makeRequest('m-1', {
      state: 'FINISHED',
      version: 3,
    });

    const res = await PATCH(req, await params('m-1'));

    expect(res.status).toBe(200);
    expect(mockTransition).toHaveBeenCalledWith(
      'm-1',
      'FINISHED',
      undefined,
      undefined,
      { allowScoreEdit: undefined, expectedVersion: 3 },
    );
  });

  it('quando transitionMatchState retorna null, route responde 404 MATCH_NOT_FOUND', async () => {
    mockTransition.mockResolvedValueOnce(null as any);

    const req = makeRequest('missing', {
      state: 'IN_PROGRESS',
      version: 1,
    });

    const res = await PATCH(req, await params('missing'));
    expect(res.status).toBe(404);
    const b = await res.json();
    expect(b.error).toBe('MATCH_NOT_FOUND');
  });

  it('outros estados de erro (não VERSION_CONFLICT) retornam 422', async () => {
    mockTransition.mockResolvedValueOnce({ error: 'INVALID_TRANSITION' } as any);

    const req = makeRequest('m-1', {
      state: 'IN_PROGRESS',
      version: 1,
    });

    const res = await PATCH(req, await params('m-1'));
    expect(res.status).toBe(422);
    const b = await res.json();
    expect(b.error).toBe('INVALID_TRANSITION');
  });

  it('accepta version undefined (caminho legado sem optimistic locking)', async () => {
    mockTransition.mockResolvedValueOnce({
      id: 'm-1',
      state: 'IN_PROGRESS',
      version: 1,
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
    } as any);

    const req = makeRequest('m-1', {
      state: 'IN_PROGRESS',
      initialServerId: 'p1',
    });

    const res = await PATCH(req, await params('m-1'));
    expect(res.status).toBe(200);
    // expectedVersion deve ser undefined (não trancado)
    expect(mockTransition).toHaveBeenCalledWith(
      'm-1',
      'IN_PROGRESS',
      'p1',
      undefined,
      { allowScoreEdit: undefined, expectedVersion: undefined },
    );
  });

  it('validação do Zod rejeita estado SCHEDULED (400)', async () => {
    const req = makeRequest('m-1', {
      state: 'SCHEDULED',
      version: 1,
    });
    const res = await PATCH(req, await params('m-1'));
    expect(res.status).toBe(400);
    const b = await res.json();
    expect(b.error).toBe('VALIDATION_ERROR');
  });

  it('verifica que o service transitionMatchState é chamado com expectedVersion quando body.version presente', async () => {
    mockTransition.mockResolvedValue({
      id: 'm-1',
      state: 'IN_PROGRESS',
      version: 2,
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
    } as any);

    // Envia version=5 e espera que o service recebe expectedVersion=5
    await PATCH(makeRequest('m-1', { state: 'IN_PROGRESS', version: 5 }), await params('m-1'));

    const lastCall = mockTransition.mock.calls[mockTransition.mock.calls.length - 1];
    expect(lastCall[4]).toEqual({ allowScoreEdit: undefined, expectedVersion: 5 });
  });
});
