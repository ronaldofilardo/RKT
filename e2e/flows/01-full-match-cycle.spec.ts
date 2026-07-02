import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';

test.describe('TEST-02.1: Fluxo completo — Criar partida → Pontuar → Sessão → Endossar → Encerrar', () => {
  let ctx: TestContext;

  test.beforeAll(async () => {
    ctx = await TestContext.create();
  });

  test('criar partida com formato MATCH_TB_10', async () => {
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
    expect(match.state).toBe('SCHEDULED');
    expect(match.format).toBe('MATCH_TB_10');
    expect(match.player1Id).toBe(ctx.athlete1.userId);
    expect(match.player2Id).toBe(ctx.athlete2.userId);

    ctx.matchId = match.id;
  });

  test('iniciar partida (SCHEDULED → IN_PROGRESS)', async () => {
    const res = await ctx.api.patch(`/api/matches/${ctx.matchId}/state`, {
      data: {
        state: 'IN_PROGRESS',
        initialServerId: ctx.athlete1.userId,
      },
      headers: ctx.authHeader(ctx.athlete1.token),
    });

    expect(res.ok()).toBeTruthy();
    const match = await res.json();
    expect(match.state).toBe('IN_PROGRESS');
    expect(match.startedAt).toBeDefined();
  });

  test('registrar pontos até vencer o match tiebreak', async () => {
    // MATCH_TB_10: first to 10 with 2-point lead
    let pontoCount = 0;
    for (let i = 0; i < 15; i++) {
      const res = await ctx.api.post(`/api/matches/${ctx.matchId}/point`, {
        data: {
          winnerId: ctx.athlete1.userId,
          type: 'WINNER',
          serverId: ctx.athlete1.userId,
        },
        headers: ctx.authHeader(ctx.athlete1.token),
      });

      if (!res.ok()) {
        // Match engine finished — stop registering points
        break;
      }
      pontoCount++;
    }
    expect(pontoCount).toBeGreaterThanOrEqual(10);
  });

  test('criar sessão de anotação como coach', async () => {
    const res = await ctx.api.post(`/api/matches/${ctx.matchId}/sessions`, {
      data: { autoStarted: false },
      headers: ctx.authHeader(ctx.coach.token),
    });

    expect(res.ok()).toBeTruthy();
    const session = await res.json();
    expect(session.id).toBeDefined();
    expect(session.matchId).toBe(ctx.matchId);
    expect(session.annotatorUserId).toBe(ctx.coach.userId);
    expect(session.isActive).toBe(true);
    expect(session.status).toBe('IN_PROGRESS');

    ctx.sessionId = session.id;
  });

  test('abandonar sessão', async () => {
    const res = await ctx.api.post(
      `/api/matches/${ctx.matchId}/sessions/${ctx.sessionId}/abandon`,
      {
        data: {},
        headers: ctx.authHeader(ctx.coach.token),
      }
    );

    expect(res.ok()).toBeTruthy();
    const session = await res.json();
    expect(session.status).toBe('ABANDONED');
    expect(session.isActive).toBe(false);
  });

  test('endossar sessão como admin (outro usuário)', async () => {
    // Session must be inactive and endorsed by a different user
    const res = await ctx.api.post(
      `/api/matches/${ctx.matchId}/sessions/${ctx.sessionId}/endorse`,
      {
        headers: ctx.authHeader(ctx.admin.token),
      }
    );

    expect(res.ok()).toBeTruthy();
    const endorsement = await res.json();
    expect(endorsement.id).toBeDefined();
    expect(endorsement.sessionId).toBe(ctx.sessionId);
    expect(endorsement.endorsedByUserId).toBe(ctx.admin.userId);
  });

  test('encerrar partida (IN_PROGRESS → FINISHED)', async () => {
    const res = await ctx.api.patch(`/api/matches/${ctx.matchId}/state`, {
      data: { state: 'FINISHED' },
      headers: ctx.authHeader(ctx.athlete1.token),
    });

    expect(res.ok()).toBeTruthy();
    const match = await res.json();
    expect(match.state).toBe('FINISHED');
    expect(match.finishedAt).toBeDefined();
  });
});
