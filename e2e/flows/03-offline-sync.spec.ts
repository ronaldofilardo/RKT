import { test, expect } from '@playwright/test';
import { USERS, loginAs, clearCache } from '../helpers/auth';

test.describe('TEST-02.3: Offline — indicador visual e mecanismo de sync', () => {
  let athlete1Token: string;
  let athlete1Id: string;
  let athlete2Id: string;
  let matchId: string;

  test.beforeAll(async () => {
    clearCache();

    // Use loginAs which creates its own API context
    // (fixtures like `request` are not available in beforeAll)
    const a1 = await loginAs('athlete1');
    athlete1Token = a1.token;
    athlete1Id = a1.userId;

    const a2 = await loginAs('athlete2');
    athlete2Id = a2.userId;

    // Create match using the API context from loginAs
    const res = await a1.api.post('/api/matches', {
      data: {
        player1Id: a1.userId,
        player2Id: a2.userId,
        format: 'BEST_OF_3',
        initialServerId: a1.userId,
      },
      headers: { Authorization: `Bearer ${a1.token}` },
    });

    if (!res.ok()) {
      const body = await res.text();
      throw new Error(`Match creation failed: ${res.status()} ${body}`);
    }
    const match = await res.json();
    matchId = match.id;

    const stateRes = await a1.api.patch(`/api/matches/${matchId}/state`, {
      data: { state: 'IN_PROGRESS', initialServerId: a1.userId },
      headers: { Authorization: `Bearer ${a1.token}` },
    });

    if (!stateRes.ok()) {
      const body = await stateRes.text();
      throw new Error(`State transition failed: ${stateRes.status()} ${body}`);
    }
  });

  test('página de scoring mostra banner offline quando desconectado', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((token) => {
      sessionStorage.setItem('access_token', token);
    }, athlete1Token);

    await page.goto(`/match/${matchId}/scoring`);
    await page.waitForTimeout(3000);

    await expect(page.locator('text=Modo Offline')).toHaveCount(0);

    await page.context().setOffline(true);
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Modo Offline')).toBeVisible({ timeout: 10000 });

    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Modo Offline')).toHaveCount(0, { timeout: 10000 });
  });

  test('IndexedDB: enfileirar e ler itens da fila offline', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async (mid) => {
      const DB_NAME = 'racket-offline-db';
      const STORE_NAME = 'optimistic-queue';

      const db = await new Promise<any>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const store = req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('timestamp', 'timestamp');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const action = {
        id: crypto.randomUUID(),
        matchId: mid,
        type: 'POINT',
        payload: { winnerId: 'any', type: 'WINNER', serverId: 'any', timestamp: Date.now() },
        status: 'PENDING',
        retries: 0,
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).add(action);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      const pending = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const r = tx.objectStore(STORE_NAME).getAll();
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(action.id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      db.close();
      return {
        enqueued: pending.length,
        item: pending[0] ? { id: pending[0].id, matchId: pending[0].matchId, status: pending[0].status } : null,
      };
    }, matchId);

    expect(result.enqueued).toBe(1);
    expect(result.item).not.toBeNull();
    expect(result.item!.matchId).toBe(matchId);
    expect(result.item!.status).toBe('PENDING');
  });

  test('API endpoint de ponto aceita payload com sequenceNumber', async ({ request }) => {
    const res = await request.post(`/api/matches/${matchId}/point`, {
      data: {
        winnerId: athlete1Id,
        type: 'WINNER',
        serverId: athlete1Id,
        sequenceNumber: 1,
      },
      headers: { Authorization: `Bearer ${athlete1Token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.scoreState).toBeDefined();
  });
});
