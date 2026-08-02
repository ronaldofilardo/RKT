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

import { findPlayerByEmail } from '@/services/playerService';
import { SignJWT } from 'jose';

export async function loginAs(role: UserRole): Promise<{ token: string; userId: string; api: APIRequestContext }> {
  if (cachedTokens[role] && cachedIds[role]) {
    const api = await request.newContext({ baseURL: 'http://127.0.0.1:3000' });
    return { token: cachedTokens[role]!, userId: cachedIds[role]!, api };
  }

  const user = USERS[role];
  const api = await request.newContext({ baseURL: 'http://127.0.0.1:3000' });

  if (process.env.NODE_ENV === 'test') {
    const player = await findPlayerByEmail(user.email);
    if (!player) {
      throw new Error(`User not found for ${user.email}`);
    }
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
    const accessToken = await new SignJWT({ sub: player.id, role: player.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(JWT_SECRET);
    cachedTokens[role] = accessToken;
    cachedIds[role] = player.id;
    return { token: accessToken, userId: player.id, api };
  }

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
