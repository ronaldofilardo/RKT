/**
 * Testes para withRLSHandler — valida que requests HTTP concorrentes não vazam
 * o contexto RLS entre si.
 *
 * Cobre correção do bug 1.1: `enterWith()` (sticky mode) do AsyncLocalStorage
 * persistia o contexto após o handler retornar, fazendo requests subsequentes
 * reutilizarem o `getRLSUser()` de request anterior no mesmo pool de tasks.
 *
 * Após a refatoração, `withRLSHandler` usa `runWithRLS` (rtlStorage.run), que
 * é scoped à execução do handler: ao terminar, o contexto volta ao estado
 * anterior (null). Estes testes verificam que isso não vaza em:
 *   1. Execução sequencial (request A termina, request B começa).
 *   2. Execução concorrente via Promise.all (race real de microtasks).
 *   3. Handlers que rodam setTimeout/Promise.then em callbacks deferidas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { createToken } from '@tests/helpers/auth';

function makeRequest(token: string, userId: string, role: string) {
  return new NextRequest('http://localhost:3000/api/matches', {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'x-user-id': userId,
      'x-user-role': role,
    },
  });
}

describe('withRLSHandler — isolamento de contexto RLS entre requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('execução sequencial: request B não vê o user de A após A terminar', async () => {
    const tokenA = await createToken('user-A', 'ATHLETE');
    const tokenB = await createToken('user-B', 'ATHLETE');

    let observedA: string | null = null;
    let observedB: string | null = null;
    let observedAfterA: string | null = null;

    // Request A
    const reqA = makeRequest(tokenA, 'user-A', 'ATHLETE');
    await withRLSHandler(reqA, 'SPECTATOR', async () => {
      observedA = getRLSUser()?.id ?? null;
      return NextResponse.json({ ok: true });
    });

    // Após A, getRLSUser() deve ser null
    observedAfterA = getRLSUser()?.id ?? null;
    expect(observedAfterA).toBeNull();

    // Request B (mesmo pool, mas depois de A)
    const reqB = makeRequest(tokenB, 'user-B', 'ATHLETE');
    await withRLSHandler(reqB, 'SPECTATOR', async () => {
      observedB = getRLSUser()?.id ?? null;
      return NextResponse.json({ ok: true });
    });

    expect(observedA).toBe('user-A');
    expect(observedB).toBe('user-B');
    // Confirma que B não herdou contexto de A.
    expect(observedB).not.toBe('user-A');
  });

  it('execução concorrente (Promise.all): A e B rodam ao mesmo tempo e cada um vê o seu próprio user', async () => {
    const tokenA = await createToken('user-A', 'ATHLETE');
    const tokenB = await createToken('user-B', 'ATHLETE');

    // Guarda uma sequência de samples de getRLSUser() durante a execução de
    // cada handler. Cada handler é strumentado para fazer um await aleatório
    // curto, forçando intercalação de microtasks (caso real de race).
    const samplesA: (string | null)[] = [];
    const samplesB: (string | null)[] = [];

    const reqA = makeRequest(tokenA, 'user-A', 'ATHLETE');
    const handlerA = async () => {
      samplesA.push(getRLSUser()?.id ?? null);
      await new Promise((r) => setTimeout(r, 5));
      samplesA.push(getRLSUser()?.id ?? null);
      await new Promise((r) => setTimeout(r, 10));
      samplesA.push(getRLSUser()?.id ?? null);
      return NextResponse.json({ ok: true });
    };

    const reqB = makeRequest(tokenB, 'user-B', 'ATHLETE');
    const handlerB = async () => {
      samplesB.push(getRLSUser()?.id ?? null);
      await new Promise((r) => setTimeout(r, 3));
      samplesB.push(getRLSUser()?.id ?? null);
      await new Promise((r) => setTimeout(r, 15));
      samplesB.push(getRLSUser()?.id ?? null);
      return NextResponse.json({ ok: true });
    };

    await Promise.all([
      withRLSHandler(reqA, 'SPECTATOR', handlerA),
      withRLSHandler(reqB, 'SPECTATOR', handlerB),
    ]);

    // Cada handler precisa ver exclusivamente o seu próprio user em todos os
    // pontos da execução concorrente.
    expect(samplesA.every((s) => s === 'user-A')).toBe(true);
    expect(samplesB.every((s) => s === 'user-B')).toBe(true);

    // Sanity check: não permite que A vê B ou vice-versa em nenhum sample.
    expect(samplesA).not.toContain('user-B');
    expect(samplesB).not.toContain('user-A');
  });

  it('callback after `await`: getRLSUser() continua válido dentro do callback', async () => {
    const token = await createToken('user-persist', 'ATHLETE');
    const req = makeRequest(token, 'user-persist', 'ATHLETE');

    let observedAfterAwait: string | null = null;

    await withRLSHandler(req, 'SPECTATOR', async () => {
      await new Promise((r) => setTimeout(r, 20));
      observedAfterAwait = getRLSUser()?.id ?? null;
      return NextResponse.json({ ok: true });
    });

    expect(observedAfterAwait).toBe('user-persist');
    // Cleanup após o handler retornar: contexto restaura para null.
    expect(getRLSUser()).toBeNull();
  });

  it('role insuficiente retorna 403 antes de estabelecer contexto (curto-circuito)', async () => {
    const token = await createToken('user-low', 'SPECTATOR');
    const req = makeRequest(token, 'user-low', 'SPECTATOR');

    const handler = jest.fn(async () => NextResponse.json({ ok: true }));

    const res = await withRLSHandler(req, 'ADMIN', handler);

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    // Contexto não deve ter sido estabelecido (curto-circuita antes de runWithRLS).
    expect(getRLSUser()).toBeNull();
  });

  it('sem headers x-user-id/x-user-role: fallback ao JWT retorna 200 e estabelece contexto', async () => {
    const token = await createToken('user-X', 'ATHLETE');
    // request sem os headers do middleware (simula bypass)
    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const handler = jest.fn(async () => NextResponse.json({ ok: true }));

    const res = await withRLSHandler(req, 'ATHLETE', handler);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it('10 requests concorrentes com 10 users distintos: cada um vê exatamente o seu user', async () => {
    const n = 10;
    const requests = await Promise.all(
      Array.from({ length: n }, async (_, i) => {
        const token = await createToken(`user-${i}`, 'ATHLETE');
        const req = makeRequest(token, `user-${i}`, 'ATHLETE');
        return { req, idx: i };
      }),
    );

    const observed = new Map<number, Set<string | null>>();

    const handlers = requests.map(({ req, idx }) => {
      return withRLSHandler(req, 'SPECTATOR', async () => {
        // vários awaits intercalados
        for (let k = 0; k < 3; k++) {
          await new Promise((r) => setTimeout(r, Math.random() * 5));
          const u = getRLSUser()?.id ?? null;
          if (!observed.has(idx)) observed.set(idx, new Set());
          observed.get(idx)!.add(u);
        }
        return NextResponse.json({ ok: true });
      });
    });

    await Promise.all(handlers);

    // Para cada request idx, o conjunto de users observados deve ser
    // exatamente {`user-${idx}`} — nunca null e nunca user de outro request.
    for (let idx = 0; idx < n; idx++) {
      const samples = observed.get(idx)!;
      expect(samples.size).toBe(1);
      expect(Array.from(samples)[0]).toBe(`user-${idx}`);
    }

    // Após todos terminarem: contexto global restaura para null.
    expect(getRLSUser()).toBeNull();
  });

  it('throw dentro do handler não vaza o contexto para o catch externo', async () => {
    const token = await createToken('user-throwing', 'ATHLETE');
    const req = makeRequest(token, 'user-throwing', 'ATHLETE');

    let userInCatch: string | null = null;

    await expect(
      withRLSHandler(req, 'SPECTATOR', async () => {
        expect(getRLSUser()?.id).toBe('user-throwing');
        throw new Error('handler-threw');
      }),
    ).rejects.toThrow('handler-threw');

    // Após o throw, contexto restaura para null.
    userInCatch = getRLSUser()?.id ?? null;
    expect(userInCatch).toBeNull();
  });
});
