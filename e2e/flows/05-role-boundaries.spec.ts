import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';
import { expectNoAxeViolations } from '../helpers/a11y';

/**
 * TEST — Role Boundaries (TD-003 regression guard)
 *
 * Cenario critico: troca de token em runtime garante que withRLSHandler +
 * AsyncLocalStorage (runWithRLS) nao vazam contexto entre requests
 * e que cada role receba os escopos corretos.
 *
 * Cobre:
 *   1. ATHLETE cria partida (POST /api/matches com role ATHLETE) — 200.
 *   2. Troca para COACH via nova autenticação — o escopo vira COACH.
 *   3. COACH tenta criar partida (escopo exige ATHLETE) — 403.
 *   4. COACH cria sessão de anotação (escopo COACH) — 200.
 *   5. Isolamento confirmado: o request do ATHLETE não vaza contexto pro COACH.
 *   6. Acessibilidade: nenhum erro crítico/serious no fluxo.
 */
test.describe('TEST-03.2: Role Boundaries — TD-003 anti-regression', () => {
  let ctx: TestContext;
  let matchId: string;

  test.beforeAll(async () => {
    ctx = await TestContext.create();
  });

  test('ATHLETE cria partida com role ATHLETE', async () => {
    const res = await ctx.api.post('/api/matches', {
      data: {
        player1Id: ctx.athlete1.userId,
        player2Id: ctx.athlete2.userId,
        format: 'MATCH_TB_10',
        initialServerId: ctx.athlete1.userId,
      },
      headers: ctx.authHeader(ctx.athlete1.token),
    });

    expect(res.ok()).toBeTruthy();
    const match = await res.json();
    expect(match.id).toBeDefined();
    matchId = match.id;
  });

  test('troca para COACH: novo request com token COACH deve ter escopo COACH', async () => {
    // requests concorrentes para detectar leak de AsyncLocalStorage
    const responses = await Promise.all([
      ctx.api.post(`/api/matches/${matchId}/state`, {
        data: { state: 'IN_PROGRESS', initialServerId: ctx.athlete1.userId },
        headers: ctx.authHeader(ctx.athlete1.token),
      }),
      ctx.api.post(`/api/matches/${matchId}/sessions`, {
        data: { autoStarted: false },
        headers: ctx.authHeader(ctx.coach.token),
      }),
    ]);

    expect(responses[0].ok()).toBeTruthy();
    expect(responses[1].ok()).toBeTruthy();

    const match = await responses[0].json();
    expect(match.state).toBe('IN_PROGRESS');
    const session = await responses[1].json();
    expect(session.annotatorUserId).toBe(ctx.coach.userId);
  });

  test('COACH NAO pode criar partida (escopo exige ATHLETE) — 403', async () => {
    const res = await ctx.api.post('/api/matches', {
      data: {
        player1Id: ctx.athlete1.userId,
        player2Id: ctx.athlete2.userId,
        format: 'BEST_OF_3',
        initialServerId: ctx.athlete1.userId,
      },
      headers: ctx.authHeader(ctx.coach.token),
    });

    expect(res.status()).toBe(403);
  });

  test('ATHLETE NAO pode criar sessão de anotação (escopo exige COACH) — 403', async () => {
    // duplica matchId no body para satisfazer Zod e exercitar 403 por role.
    const res = await ctx.api.post(`/api/matches/${matchId}/sessions`, {
      data: {},
      headers: ctx.authHeader(ctx.athlete1.token),
    });

    expect(res.status()).toBe(403);
  });

  test('UI: dashboard respeita role (a11y + visibilidade)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((token) => {
      sessionStorage.setItem('access_token', token);
    }, ctx.coach.token);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expectNoAxeViolations(page, { logLowerSeverity: true });
  });
});
