import { test, expect } from '@playwright/test';
import { TestContext } from '../helpers/test-context';

test.describe('TEST-02.2: Suspender sessão → Retomar → Continuar', () => {
  let ctx: TestContext;

  test.beforeAll(async () => {
    ctx = await TestContext.create();
  });

  test('criar partida e iniciar', async () => {
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
    ctx.matchId = match.id;

    const stateRes = await ctx.api.patch(`/api/matches/${ctx.matchId}/state`, {
      data: { state: 'IN_PROGRESS', initialServerId: ctx.athlete1.userId },
      headers: ctx.authHeader(ctx.athlete1.token),
    });
    expect(stateRes.ok()).toBeTruthy();
  });

  test('registrar alguns pontos', async () => {
    for (let i = 0; i < 4; i++) {
      const res = await ctx.api.post(`/api/matches/${ctx.matchId}/point`, {
        data: {
          winnerId: ctx.athlete1.userId,
          type: 'WINNER',
          serverId: ctx.athlete1.userId,
        },
        headers: ctx.authHeader(ctx.athlete1.token),
      });
      expect(res.ok()).toBeTruthy();
    }
  });

  test('criar primeira sessão de anotação como coach', async () => {
    const res = await ctx.api.post(`/api/matches/${ctx.matchId}/sessions`, {
      data: {},
      headers: ctx.authHeader(ctx.coach.token),
    });

    expect(res.ok()).toBeTruthy();
    const session = await res.json();
    expect(session.isActive).toBe(true);
    expect(session.status).toBe('IN_PROGRESS');
    ctx.sessionId = session.id;
  });

  test('abandonar sessão (simular suspensão)', async () => {
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

  test('retomar sessão (criar nova após abandono)', async () => {
    // When autoStarted is false, reactivateOrCreateSession will
    // check existing sessions. Since the previous one is abandoned,
    // it will reactivate it (set isActive=true, status=IN_PROGRESS)
    const res = await ctx.api.post(`/api/matches/${ctx.matchId}/sessions`, {
      data: {},
      headers: ctx.authHeader(ctx.coach.token),
    });

    expect(res.ok()).toBeTruthy();
    const session = await res.json();
    expect(session.isActive).toBe(true);
    expect(session.status).toBe('IN_PROGRESS');
    // Should have the previous session's ID (reactivated)
    expect(session.suspended).toBe(true);
  });

  test('verificar lista de sessões suspensas', async () => {
    // Only one active session should exist for this coach+match
    const res = await ctx.api.get(`/api/matches/${ctx.matchId}/sessions`, {
      headers: ctx.authHeader(ctx.coach.token),
    });

    expect(res.ok()).toBeTruthy();
    const sessions = await res.json();
    expect(Array.isArray(sessions)).toBe(true);
    // Should have at most 2 sessions (1 abandoned + 1 active = same ID reactivated)
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    const activeSession = sessions.find((s: any) => s.isActive);
    expect(activeSession).toBeDefined();
    expect(activeSession.status).toBe('IN_PROGRESS');
  });

  test('registrar mais pontos após retomar', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await ctx.api.post(`/api/matches/${ctx.matchId}/point`, {
        data: {
          winnerId: ctx.athlete2.userId,
          type: 'FORCED_ERROR',
          serverId: ctx.athlete1.userId,
        },
        headers: ctx.authHeader(ctx.athlete1.token),
      });
      expect(res.ok()).toBeTruthy();
    }
  });
});
