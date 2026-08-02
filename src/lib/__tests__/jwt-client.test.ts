import { describe, it, expect, beforeEach } from '@jest/globals';
import { SignJWT } from 'jose';
import { decodeJwtPayload, isTokenExpired } from '@/lib/jwt-client';

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-at-least-32-chars-long';
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function buildRealJwt(payload: object): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(secretKey);
}

describe('jwt-client', () => {
  describe('decodeJwtPayload', () => {
    it('decodifica payload válido', async () => {
      const token = await buildRealJwt({ sub: 'user-1', role: 'ATHLETE' });
      const result = await decodeJwtPayload(token);
      expect(result).toEqual({ sub: 'user-1', role: 'ATHLETE' });
    });

    it('retorna null para string vazia', async () => {
      expect(await decodeJwtPayload('')).toBeNull();
    });

    it('retorna null para token sem 3 partes', async () => {
      expect(await decodeJwtPayload('invalid.token')).toBeNull();
      expect(await decodeJwtPayload('a.b.c.d')).toBeNull();
    });

    it('retorna null para token com JSON inválido no payload', async () => {
      const badPayload = btoa('not-json{').replace(/=/g, '');
      expect(await decodeJwtPayload(`aaa.${badPayload}.sig`)).toBeNull();
    });

    it('retorna null para token expirado', async () => {
      const token = await buildRealJwt({
        sub: 'user-1',
        role: 'ATHLETE',
        exp: Math.floor(Date.now() / 1000) - 60,
      });
      expect(await decodeJwtPayload(token)).toBeNull();
    });

    it('retorna null para token com signature inválida', async () => {
      const token = 'header.payload.fake-signature';
      expect(await decodeJwtPayload(token)).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('retorna true quando exp está no passado', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60;
      const token = `header.${btoa(JSON.stringify({ exp: pastExp })).replace(/=/g, '')}.sig`;
      expect(isTokenExpired(token)).toBe(true);
    });

    it('retorna false quando exp está no futuro', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = `header.${btoa(JSON.stringify({ exp: futureExp })).replace(/=/g, '')}.sig`;
      expect(isTokenExpired(token)).toBe(false);
    });

    it('retorna false para token sem exp', () => {
      const token = `header.${btoa(JSON.stringify({ sub: 'u' })).replace(/=/g, '')}.sig`;
      expect(isTokenExpired(token)).toBe(false);
    });

    it('retorna false para token malformado (sem exp válido)', () => {
      expect(isTokenExpired('not-a-jwt')).toBe(false);
      expect(isTokenExpired('')).toBe(false);
    });

    it('respeita skew configurado', () => {
      const nearFutureExp = Math.floor(Date.now() / 1000) + 30;
      const token = `header.${btoa(JSON.stringify({ exp: nearFutureExp })).replace(/=/g, '')}.sig`;
      expect(isTokenExpired(token, 0)).toBe(false);
      expect(isTokenExpired(token, 60)).toBe(true);
    });
  });
});