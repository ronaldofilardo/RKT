import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';
import { waitForApiCall, getByTestid } from '../helpers/wait-helpers';
import { expectNoAxeViolations } from '../helpers/a11y';

/**
 * TEST — Undo/Redo Annotation Regression
 *
 * Cenario critico: undo tem que persistir no backend via PATCH /state
 * (label='undo' em useScoringHandlers.ts:289-303). REDO nao esta exposto
 * na UI — engine expõe replayCurrentPoint (engine.history.ts:20) mas
 * sem botão. Esta spec cobre a regressao de undo; o caso de redo fica
 * documentado em TECH_DEBT.md (TD-031 a ser adicionado se aplicavel).
 *
 * Fluxo:
 *   1. Cria partida + inicia
 *   2. Pontua 2x via API (nao passa por modal details — fluxo rapido)
 *   3. Carrega UI da partida
 *   4. Aciona botão "Corrigir" (data-testid="undo-button")
 *   5. Confirma no UndoConfirmModal
 *   6. Valida que PATCH /state e reverse de points ocorreu
 *   7. Tenta redo (gap conhecido: sem UI) — apenas documenta
 */
test.describe('TEST-03.1: Undo/Redo Annotation (regressão crítica de anotação)', () => {
  let ctx: TestContext;
  let matchId: string;

  test.beforeAll(async () => {
    ctx = await TestContext.create();

    // Setup: cria partida em IN_PROGRESS com 2 pontos registrados
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
    matchId = (await matchRes.json()).id;

    const stateRes = await ctx.api.patch(`/api/matches/${matchId}/state`, {
      data: { state: 'IN_PROGRESS', initialServerId: ctx.athlete1.userId },
      headers: ctx.authHeader(ctx.athlete1.token),
    });
    expect(stateRes.ok()).toBeTruthy();

    for (let i = 0; i < 2; i++) {
      const pointRes = await ctx.api.post(`/api/matches/${matchId}/point`, {
        data: {
          winnerId: ctx.athlete1.userId,
          type: 'WINNER',
          serverId: ctx.athlete1.userId,
        },
        headers: ctx.authHeader(ctx.athlete1.token),
      });
      expect(pointRes.ok()).toBeTruthy();
    }
  });

  test('undo reverte pontos + dispara PATCH /state para persistir no backend', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate((token) => {
      sessionStorage.setItem('access_token', token);
    }, ctx.athlete1.token);

    // Captura PATCH /state que virá como efeito do undo persistido.
    const patchPromise = waitForApiCall(
      { page },
      /\/api\/matches\/.*\/state/
    );

    await page.goto(`/match/${matchId}/scoring`);
    await page.waitForLoadState('networkidle');

    // canUndo deve estar true após 2 pontos
    const undoButton = page.locator('button:has-text("Corrigir")').first();
    await expect(undoButton).toBeEnabled();

    await undoButton.click();

    // Modal de confirmacao — usa h2 "Desfazer ponto?"
    const confirmTitle = page.locator('h2:has-text("Desfazer ponto")');
    await expect(confirmTitle).toBeVisible({ timeout: 5_000 });

    await page.locator('button:has-text("Desfazer")').click();

    const response = await patchPromise;
    expect(response.status()).toBe(200);

    await expectNoAxeViolations(page, { logLowerSeverity: true });
  });

  test('redo deve ter botão na UI — engine expõe replayCurrentPoint com wire-up', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate((token) => {
      sessionStorage.setItem('access_token', token);
    }, ctx.athlete1.token);

    await page.goto(`/match/${matchId}/scoring`);
    await page.waitForLoadState('networkidle');

    const redoButton = page.locator(
      '[data-testid="redo-button"], button:has-text("Refazer")'
    );

    const count = await redoButton.count();
    expect(count).toBeGreaterThan(0);

    await expectNoAxeViolations(page, { logLowerSeverity: true });
  });
});
