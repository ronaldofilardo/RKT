/**
 * Helpers de autenticação para suítes de teste (Jest).
 *
 * Centraliza `JWT_SECRET` e `createToken()` para evitar a duplicação que
 * existia em 5+ suítes. Sprint 2 (TD-029 parcial).
 *
 * Owner: @qa
 */

import { SignJWT } from 'jose';

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'test-secret',
);

export async function createToken(
  userId: string,
  role: string,
): Promise<string> {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}
