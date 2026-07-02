import { APIRequestContext } from '@playwright/test';
import { UserRole, loginAs } from './auth';

/**
 * Shared context for a single E2E test — holds tokens, IDs,
 * and the Playwright request context for all API calls.
 */
export class TestContext {
  readonly athlete1: { token: string; userId: string };
  readonly athlete2: { token: string; userId: string };
  readonly coach: { token: string; userId: string };
  readonly admin: { token: string; userId: string };
  readonly api: APIRequestContext;

  matchId?: string;
  sessionId?: string;

  private constructor(opts: {
    athlete1: { token: string; userId: string };
    athlete2: { token: string; userId: string };
    coach: { token: string; userId: string };
    admin: { token: string; userId: string };
    api: APIRequestContext;
  }) {
    this.athlete1 = opts.athlete1;
    this.athlete2 = opts.athlete2;
    this.coach = opts.coach;
    this.admin = opts.admin;
    this.api = opts.api;
  }

  static async create(): Promise<TestContext> {
    const [a1, a2, c, ad] = await Promise.all([
      loginAs('athlete1'),
      loginAs('athlete2'),
      loginAs('coach'),
      loginAs('admin'),
    ]);

    return new TestContext({
      athlete1: { token: a1.token, userId: a1.userId },
      athlete2: { token: a2.token, userId: a2.userId },
      coach: { token: c.token, userId: c.userId },
      admin: { token: ad.token, userId: ad.userId },
      api: c.api,
    });
  }

  authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }
}
