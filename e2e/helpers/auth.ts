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

export async function loginAs(role: UserRole): Promise<{ token: string; userId: string; api: APIRequestContext }> {
  if (cachedTokens[role] && cachedIds[role]) {
    const api = await request.newContext({ baseURL: 'http://localhost:3000' });
    return { token: cachedTokens[role]!, userId: cachedIds[role]!, api };
  }

  const user = USERS[role];
  const api = await request.newContext({ baseURL: 'http://localhost:3000' });

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

export function clearCache() {
  cachedTokens = {};
  cachedIds = {};
}
