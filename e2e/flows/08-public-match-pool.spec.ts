import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';

/**
 * A0.13 — Pool de Partidas Públicas (S1):
 * 1. criação de cartaz público (POST /api/matches) e listagem no GET /api/matches/pool;
 * 2. paginação do pool (limit=1 → nextCursor);
 * 3. annotate mode=resolve idempotente (201 → 200, mesmo matchId) + annotationCount;
 * 4. annotate mode=create repetido → 409 ALREADY_ANNOTATING;
 * 5. UI: /partidas-publicas → card → "Anotar esta partida" → /match/[id]/scoring.
 */
test.describe('Pool de Partidas Públicas (08)', () => {
  let ctx: TestContext;
  let templateId: string;
  let annotationMatchId: string;
  /** Marcador único para localizar o cartaz criado por este spec no pool. */
  const marker = `Pool E2E 08 ${Date.now()}`;

  test.beforeAll(async () => {
    ctx = await TestContext.create();
  });

  test('cria cartaz público e o lista no pool com annotationCount 0', async () => {
    const tplRes = await ctx.api.post('/api/matches', {
      data: {
        player1Id: ctx.athlete1.userId,
        player2Id: ctx.athlete2.userId,
        format: 'MATCH_TB_10',
        tournamentName: marker,
        isPublicTemplate: true,
        isTemplate: true,
        eventScope: 'PUBLIC',
      },
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(tplRes.status()).toBe(201);
    const tplJson = await tplRes.json();
    templateId = tplJson.id ?? tplJson.data?.id;
    expect(templateId).toBeDefined();

    const poolRes = await ctx.api.get('/api/matches/pool?limit=50', {
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(poolRes.status()).toBe(200);
    const poolJson = await poolRes.json();
    expect(Array.isArray(poolJson.data?.matches)).toBe(true);

    const item = poolJson.data.matches.find((m: { id: string }) => m.id === templateId);
    expect(item, 'cartaz público deve aparecer no pool').toBeTruthy();
    expect(item.annotationCount).toBe(0);
    expect(item.player1.name).toBeTruthy();
    expect(item.player2.name).toBeTruthy();
  });

  test('paginação do pool com limit=1 devolve nextCursor estável', async () => {
    const page1Res = await ctx.api.get('/api/matches/pool?limit=1', {
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(page1Res.status()).toBe(200);
    const page1 = await page1Res.json();
    expect(page1.data.matches).toHaveLength(1);
    // Com ao menos 1 item e limit=1, o cursor sempre existe.
    expect(typeof page1.data.nextCursor).toBe('string');

    const page2Res = await ctx.api.get(
      `/api/matches/pool?limit=1&cursor=${encodeURIComponent(page1.data.nextCursor)}`,
      { headers: ctx.authHeader(ctx.coach.token) },
    );
    expect(page2Res.status()).toBe(200);
    const page2 = await page2Res.json();
    expect(Array.isArray(page2.data.matches)).toBe(true);
    // A segunda página não repete o item da primeira.
    expect(page2.data.matches[0]?.id).not.toBe(page1.data.matches[0].id);
  });

  test('annotate resolve é idempotente: 201 na primeira vez, 200 depois, mesmo matchId', async () => {
    const first = await ctx.api.post(`/api/matches/${templateId}/annotate`, {
      data: { mode: 'resolve' },
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(first.status()).toBe(201);
    const firstJson = await first.json();
    annotationMatchId = firstJson.matchId;
    expect(annotationMatchId).toBeTruthy();
    expect(firstJson.created).toBe(true);

    const second = await ctx.api.post(`/api/matches/${templateId}/annotate`, {
      data: { mode: 'resolve' },
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(second.status()).toBe(200);
    const secondJson = await second.json();
    expect(secondJson.matchId).toBe(annotationMatchId);
    expect(secondJson.created).toBe(false);

    // O pool reflete a anotação criada.
    const poolRes = await ctx.api.get('/api/matches/pool?limit=50', {
      headers: ctx.authHeader(ctx.coach.token),
    });
    const poolJson = await poolRes.json();
    const item = poolJson.data.matches.find((m: { id: string }) => m.id === templateId);
    expect(item.annotationCount).toBe(1);
  });

  test('annotate create repetido retorna 409 ALREADY_ANNOTATING com o matchId', async () => {
    const res = await ctx.api.post(`/api/matches/${templateId}/annotate`, {
      data: { mode: 'create' },
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('CONFLICT');
    expect(body.details?.code).toBe('ALREADY_ANNOTATING');
    expect(body.details?.matchId).toBe(annotationMatchId);
  });

  test('UI: /partidas-publicas lista o cartaz e anota pelo botão do card', async ({ page }) => {
    await ctx.authenticatePage(page, 'athlete2');
    await page.goto('/partidas-publicas');

    // Topbar e página compartilham o mesmo h1 — usa o primeiro.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Partidas para Anotar' }).first(),
    ).toBeVisible();

    const card = page.locator('article').filter({ hasText: marker });
    await expect(card).toBeVisible();
    await expect(card.getByText(/anotaç(ão|ões)/)).toBeVisible();

    // athlete2 ainda não anotou este cartaz → botão de criar anotação.
    const annotateButton = card.getByRole('button', { name: 'Anotar esta partida' });
    await expect(annotateButton).toBeVisible();
    await annotateButton.click();

    // Dev server pode compilar /match/[id]/scoring no primeiro hit (Fast Refresh) — margem generosa.
    await page.waitForURL(/\/match\/.+\/scoring/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/match\/.+\/scoring/);
  });
});
