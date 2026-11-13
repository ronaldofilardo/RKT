import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';

test.describe('Isolamento Multi-Anotador (Partida-Mãe × Anotações Soberanas)', () => {
  let ctx: TestContext;
  let templateId: string;
  let matchIdA: string;
  let matchIdB: string;

  test.beforeAll(async () => {
    ctx = await TestContext.create();
  });

  test('cria cartaz público e gera anotações soberanas isoladas para Anotador A e Anotador B', async () => {
    const tplRes = await ctx.api.post('/api/matches', {
      data: {
        player1Id: ctx.athlete1.userId,
        player2Id: ctx.athlete2.userId,
        format: 'MATCH_TB_10',
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

    // Anotador A (treinador) inicia sua anotação
    const annARes = await ctx.api.post(`/api/matches/${templateId}/annotate`, {
      data: { mode: 'resolve' },
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect([200, 201]).toContain(annARes.status());
    matchIdA = (await annARes.json()).matchId;

    // Anotador B (outro usuário/pai) inicia sua anotação da mesma partida
    const annBRes = await ctx.api.post(`/api/matches/${templateId}/annotate`, {
      data: { mode: 'resolve' },
      headers: ctx.authHeader(ctx.athlete2.token),
    });
    expect([200, 201]).toContain(annBRes.status());
    matchIdB = (await annBRes.json()).matchId;

    expect(matchIdA).not.toBe(matchIdB);
  });

  test('Anotador B sai antes do fim sem afetar Anotador A e sem acesso cruzado', async () => {
    // Iniciar e encerrar parcialmente anotação B
    const startB = await ctx.api.patch(`/api/matches/${matchIdB}/state`, {
      data: { state: 'IN_PROGRESS', initialServerId: ctx.athlete1.userId },
      headers: ctx.authHeader(ctx.athlete2.token),
    });
    expect(startB.ok()).toBeTruthy();

    const finishB = await ctx.api.post(`/api/matches/${matchIdB}/finish`, {
      data: { reason: 'ABANDONED', note: 'Sai antes do término' },
      headers: ctx.authHeader(ctx.athlete2.token),
    });
    expect(finishB.ok()).toBeTruthy();

    // Anotador A segue independente (ainda SCHEDULED/IN_PROGRESS)
    const getA = await ctx.api.get(`/api/matches/${matchIdA}`, {
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(getA.status()).toBe(200);
    expect((await getA.json()).state).toBe('SCHEDULED');

    // Bloqueio cruzado estrito: B não lê A e A não lê B
    const bReadsA = await ctx.api.get(`/api/matches/${matchIdA}/report`, {
      headers: ctx.authHeader(ctx.athlete2.token),
    });
    expect(bReadsA.status()).toBe(403);

    const aReadsB = await ctx.api.get(`/api/matches/${matchIdB}/report`, {
      headers: ctx.authHeader(ctx.coach.token),
    });
    expect(aReadsB.status()).toBe(403);
  });
});

