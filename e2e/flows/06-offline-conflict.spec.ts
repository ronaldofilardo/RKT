import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';
import { waitForToast, getByTestid } from '../helpers/wait-helpers';
import { expectNoAxeViolations } from '../helpers/a11y';

const DB_NAME = 'racket-offline-db';
const STORE_NAME = 'optimistic-queue';

/**
 * TEST — Offline Conflict Reconciliation
 *
 * Cenario critico: dois pontos sao enfileirados localmente enquanto
 * offline, mas o backend ja recebeu um ponto concorrente (sequence drift).
 * O flush deve detectar SEQUENCE_CONFLICT e reenviar com sequenceNumber
 * corrigido. Cobertura da branch em useOfflineSync.ts:104-126.
 */
test.describe('TEST-03.3: Offline Sync Conflict Reconciliation (TD-013 + seq race)', () => {
  let ctx: TestContext;
  let matchId: string;

  test.beforeAll(async () => {
    ctx = await TestContext.create();

    // Setup: cria + inicia partida
    const matchRes = await ctx.api.post('/api/matches', {
      data: {
        player1Id: ctx.athlete1.userId,
        player2Id: ctx.athlete2.userId,
        format: 'MATCH_TB_10',
        initialServerId: ctx.athlete1.userId,
      },
      headers: ctx.authHeader(ctx.athlete1.token),
    });
    expect(matchRes.ok()).toBeTruthy();
    const match = await matchRes.json();
    matchId = match.id;

    const stateRes = await ctx.api.patch(`/api/matches/${matchId}/state`, {
      data: { state: 'IN_PROGRESS', initialServerId: ctx.athlete1.userId },
      headers: ctx.authHeader(ctx.athlete1.token),
    });
    expect(stateRes.ok()).toBeTruthy();
  });

  test('flush reconcilia apos SEQUENCE_CONFLICT (backend retorna 409 + expectedSequence)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate((token) => {
      sessionStorage.setItem('access_token', token);
    }, ctx.athlete1.token);

    await page.goto(`/match/${matchId}/scoring`);
    await page.waitForLoadState('networkidle');

    // 1. Backend recebe ponto concorrente enquanto ainda online (simula cliente paralelo)
    //    sequenceNumber=1 implicito (db tem 0 pontos persistidos).
    const concurrentRes = await ctx.api.post(`/api/matches/${matchId}/point`, {
      data: {
        winnerId: ctx.athlete2.userId,
        type: 'WINNER',
        serverId: ctx.athlete1.userId,
      },
      headers: ctx.authHeader(ctx.athlete1.token),
    });
    expect(concurrentRes.ok()).toBeTruthy();

    // 2. Cliente vai offline e enfileira 2 pontos com sequenceNumber defasado (1)
    await page.context().setOffline(true);
    const syncStatus = getByTestid(page, 'sync-status');
    await expect(syncStatus).toHaveAttribute('data-sync-state', 'offline', {
      timeout: 10_000,
    });

    await page.evaluate(
      async ({ dbName, storeName, mid }) => {
        const db = await new Promise<any>((resolve, reject) => {
          const req = indexedDB.open(dbName, 1);
          req.onupgradeneeded = () => {
            const store = req.result.createObjectStore(storeName, {
              keyPath: 'id',
            });
            store.createIndex('status', 'status');
            store.createIndex('timestamp', 'timestamp');
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        for (let i = 0; i < 2; i++) {
          const action = {
            id: crypto.randomUUID(),
            matchId: mid,
            type: 'POINT',
            payload: {
              winnerId: 'athlete-1',
              type: 'WINNER',
              serverId: 'athlete-1',
            },
            status: 'PENDING',
            retries: 0,
            timestamp: Date.now() + i,
          };
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).add(action);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        }
        db.close();
      },
      { dbName: DB_NAME, storeName: STORE_NAME, mid: matchId }
    );

    // 3. Reconnect: flush vai PEgar sequenceNumber divergente, back-end
    //    responde 409 SEQUENCE_CONFLICT, e useOfflineSync.ts:104-126
    //    recalcula sequenceNumber + retry.
    await page.context().setOffline(false);

    await expect(syncStatus).toHaveCount(0, { timeout: 15_000 });

    await waitForToast(
      { page },
      { type: 'success', message: /sincronizados|sucesso/i }
    );

    // 4. Persistencia final: backend reflete os 3 pontos (1 concorrente + 2 reconciliados)
    const finalRes = await ctx.api.get(`/api/matches/${matchId}`, {
      headers: ctx.authHeader(ctx.athlete1.token),
    });
    expect(finalRes.ok()).toBeTruthy();
    const finalMatch = await finalRes.json();
    expect(finalMatch.version).toBeGreaterThanOrEqual(3);

    await expectNoAxeViolations(page, { logLowerSeverity: true });
  });
});
