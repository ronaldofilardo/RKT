import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';

test.describe('Fluxo de Retomada: Dashboard -> Modal -> Scoring', () => {
  let ctx: TestContext;
  let matchId: string;
  let sessionId: string;

  test.beforeAll(async () => {
    ctx = await TestContext.create();

    const mRes = await ctx.api.post('/api/matches', {
      data: {
        player1Id: ctx.athlete1.userId,
        player2Id: ctx.athlete2.userId,
        format: 'BEST_OF_3',
        initialServerId: ctx.athlete1.userId,
      },
      headers: ctx.authHeader(ctx.athlete1.token),
    });
    const match = await mRes.json();
    matchId = match.id ?? match.data?.id;

    await ctx.api.patch(`/api/matches/${matchId}/state`, {
      data: { state: 'IN_PROGRESS', initialServerId: ctx.athlete1.userId },
      headers: ctx.authHeader(ctx.athlete1.token),
    });

    const sRes = await ctx.api.post(`/api/matches/${matchId}/sessions`, {
      data: {},
      headers: ctx.authHeader(ctx.coach.token),
    });
    const session = await sRes.json();
    sessionId = session.id;

    const snapshot = JSON.stringify({
      sets: [{ player1: 3, player2: 2 }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    });

    await ctx.api.post(`/api/matches/${matchId}/sessions/${sessionId}/abandon`, {
      data: { matchStateSnapshot: snapshot },
      headers: ctx.authHeader(ctx.coach.token),
    });
  });

  test('deve abrir modal de retomada e navegar para scoring após confirmação', async ({ page }) => {
    await ctx.authenticatePage(page, 'coach');

    // 1. Navegação para o Dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Localizar partida na seção "Anotações Suspensas"
    const suspendedSection = page.locator('h3:has-text("Anotações Suspensas")');
    await expect(suspendedSection).toBeVisible();

    const suspendedCard = page.locator(`[data-testid="match-card-${matchId}"]`);
    await expect(suspendedCard).toBeVisible({ timeout: 10_000 });
    await suspendedCard.click();

    // 3. Validar navegação para a página de scoring da partida retomada
    await expect(page).toHaveURL(/.*\/scoring/);
    await page.waitForLoadState('networkidle');

    // 4. Validar que a tela de scoring foi carregada
    await expect(page.locator('button:has-text("Corrigir")').first()).toBeVisible();
  });
});
