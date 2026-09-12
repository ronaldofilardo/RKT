import { request, APIRequestContext } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: string;
}

export const USERS = {
  athlete1: { email: 'play@email.com', password: '12345678', name: 'Jogador Atleta', role: 'ATHLETE' },
  athlete2: { email: 'player2@email.com', password: '12345678', name: 'Segundo Jogador', role: 'ATHLETE' },
  coach: { email: 'coach@email.com', password: '12345678', name: 'Técnico', role: 'COACH' },
  admin: { email: 'admin@email.com', password: '12345678', name: 'Administrador', role: 'ADMIN' },
} as const;

export type UserRole = keyof typeof USERS;

let cachedTokens: Partial<Record<UserRole, string>> = {};
let cachedIds: Partial<Record<UserRole, string>> = {};
import type { Page } from '@playwright/test';

export async function loginAs(role: UserRole): Promise<{ token: string; userId: string; api: APIRequestContext }> {
  if (cachedTokens[role] && cachedIds[role]) {
    const api = await request.newContext({ baseURL: 'http://127.0.0.1:3000' });
    return { token: cachedTokens[role]!, userId: cachedIds[role]!, api };
  }

  const user = USERS[role];
  const api = await request.newContext({ baseURL: 'http://127.0.0.1:3000' });

  const res = await api.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed for ${user.email}: ${res.status()} ${body}`);
  }

  const body = await res.json();
  cachedTokens[role] = body.accessToken;
  cachedIds[role] = body.user.id;

  return { token: body.accessToken, userId: body.user.id, api };
}

export async function setBrowserAuth(
  page: Page,
  user: { token: string; userId?: string; role?: string }
): Promise<void> {
  const role = user.role ?? 'ATHLETE';
  await page.context().addCookies([
    { name: 'access_token', value: user.token, domain: 'localhost', path: '/' },
    { name: 'rkt_access_token', value: user.token, domain: 'localhost', path: '/' },
    { name: 'user_role', value: role, domain: 'localhost', path: '/' },
  ]);
  await page.goto('/login');
  await page.evaluate((u) => {
    sessionStorage.setItem('access_token', u.token);
    if (u.userId) sessionStorage.setItem('user_id', u.userId);
    sessionStorage.setItem('user_role', u.role);
    localStorage.setItem('access_token', u.token);
    if (u.userId) localStorage.setItem('user_id', u.userId);
    localStorage.setItem('user_role', u.role);
  }, { ...user, role });
}

export function clearCache() {
  cachedTokens = {};
  cachedIds = {};
}

