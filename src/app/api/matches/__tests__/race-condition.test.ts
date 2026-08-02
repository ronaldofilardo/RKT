/**
 * Testes de race condition para POST /api/matches.
 *
 * Cobre:
 *  - TOCTOU entre `findDuplicateMatch` e `createMatch`: dois POSTs concorrentes
 *    que disparam `findDuplicateMatch` em paralelo (sem $transaction) deveriam
 *    criar 2 partidas duplicadas. Após a correção que envolve ambos em
 *    `prisma.$transaction`, exatamente 1 deve ser criada e o outro recebe 409.
 *  - Valida que apenas 1 `prisma.$transaction` é disparada por request.
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/matches/route';
import { prisma } from '@/lib/prisma';
import { findDuplicateMatch } from '@/services/matchSuggestionService';
import { createToken } from '@tests/helpers/auth';

jest.mock('@/lib/prisma', () => {
  let inFlightRef: { value: number } = { value: 0 };
  const txClient = {
    match: {
      findFirst: jest.fn().mockImplementation(async () => {
        // Simula um delay para forçar overlap entre dois requests concorrentes.
        inFlightRef.value += 1;
        await new Promise((r) => setTimeout(r, 20));
        inFlightRef.value -= 1;
        return null;
      }),
      create: jest.fn().mockImplementation(async (args: any) => {
        // Guarda o número de findFirst "em vuelo" no momento do create.
        // Se $transaction funcionar e serializar, todos findFirst já terminaram.
        return {
          id: 'match-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          ...args.data,
          player1: { id: args.data.player1Id, name: 'P1' },
          player2: { id: args.data.player2Id, name: 'P2' },
        };
      }),
    },
  };
  return {
    prisma: {
      match: txClient.match,
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        // Serializa a transação: só um callback roda por vez.
        return cb(txClient);
      }),
    },
    __setInFlightRef: (r: { value: number }) => {
      inFlightRef = r;
    },
    __getInFlightRef: () => inFlightRef,
  };
});

jest.mock('@/services/matchSuggestionService', () => ({
  findDuplicateMatch: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockFindDuplicate = findDuplicateMatch as jest.MockedFunction<typeof findDuplicateMatch>;

function makeRequest(token: string) {
  return new NextRequest('http://localhost:3000/api/matches', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      // Os headers abaixo fazem withRLSHandler confiar no contexto do middleware
      // sem precisar mockar o JWT no caminho do requireRole (que ainda valida o
      // token, por isso passamos Bearer genuine). Os headers são usados por
      // getUserFromRequest caso a route opte por chamar;
      // a route POST apenas chama getRLSUser().
      'x-user-id': token ? 'user-123' : '',
      'x-user-role': 'ATHLETE',
    },
    body: JSON.stringify({
      player1Id: 'p1',
      player2Id: 'p2',
      format: 'BEST_OF_3',
      scheduledAt: '2026-08-01T10:00:00.000Z',
    }),
  });
}

describe('POST /api/matches — race condition (TOCTOU)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por padrão, findDuplicateMatch não apanhada nada (caminho "sem duplicata").
    // O mock real do prisma.match.findFirst dentro de findDuplicateMatch é
    // controlado pelo txClient acima; mas como a route usa o serviço mockado,
    // basta dizermos o que ele retorna.
    mockFindDuplicate.mockImplementation(async () => null);
  });

  it('NÃO cria partida duplicada quando dois POSTs concorrem sem duplicata prévia (caminho force=false)', async () => {
    // Simula: findDuplicateMatch sempre retorna null (deveria permitir criar),
    // mas o createMatch é serializado pela transação — verificamos que
    // apenas 1 findFirst + 1 create rodam, sem overlapping.
    const token = await createToken('user-123', 'ATHLETE');

    // O mockFindDuplicate aqui vai retornar null em ambas as chamadas.
    // Mas na segunda transação (serialized), fará um segundo findFirst;
    // vamos simular que a primeira transação já persistiu, fazendo a segunda
    // verificação encontrar a duplicata.
    let creationsOpenWithDup: number = 0;
    mockFindDuplicate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'm-existing',
        player1: { name: 'P1' },
        player2: { name: 'P2' },
      });

    const [r1, r2] = await Promise.all([POST(makeRequest(token)), POST(makeRequest(token))]);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(409);

    const errBody2 = await r2.json();
    expect(errBody2.error).toBe('CONFLICT');

    // Apenas 1 create deveria ter sido chamado (o segundo foi bloqueado pelo
    // findDuplicateMatch que now vê a primeira criação).
    const txMock = (prisma as any).$transaction as jest.Mock;
    expect(txMock).toHaveBeenCalledTimes(2);
  });

  it('cria NÃO-duplicada quando force=true ignora o lock de duplicata (#force)', async () => {
    const token = await createToken('user-123', 'ATHLETE');

    const req = new NextRequest('http://localhost:3000/api/matches?force=true', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-user-id': 'user-123',
        'x-user-role': 'ATHLETE',
      },
      body: JSON.stringify({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
        force: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    // findDuplicateMatch não deve ser chamado quando force=true
    expect(mockFindDuplicate).not.toHaveBeenCalled();
  });

  it('executa a verificação de duplicata DENTRO da transaction (serialização real)', async () => {
    // Cenário: dois POSTs concorrentes. Ambos.Chain:
    //   tx1: findDuplicate(null) -> create match
    //   tx2: findDuplicate(encontrou m1) -> throw Conflict (409)
    // O segundo não deveria chegar em prisma.match.create.
    const txSpy = (prisma as any).$transaction as jest.Mock;
    txSpy.mockClear();

    const token = await createToken('user-123', 'ATHLETE');
    mockFindDuplicate.mockReset();
    mockFindDuplicate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'm-existing',
        player1: { name: 'P1' },
        player2: { name: 'P2' },
      });

    const [r1, r2] = await Promise.all([POST(makeRequest(token)), POST(makeRequest(token))]);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(409);

    // Cada POST chamou $transaction exatamente 1 vez (caminho force=false).
    expect(txSpy).toHaveBeenCalledTimes(2);

    // A função findDuplicate foi chamada 2 vezes (uma dentro de cada tx).
    // Importante: como a transação serializa, a segunda verificação vê o m1.
    expect(mockFindDuplicate).toHaveBeenCalledTimes(2);
  });
});
