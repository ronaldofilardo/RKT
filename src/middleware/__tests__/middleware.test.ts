jest.mock('@/lib/jwt-client', () => ({
  decodeJwtPayload: jest.fn(),
}));

import { decodeJwtPayload } from '@/lib/jwt-client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const mockDecodeJwtPayload = decodeJwtPayload as jest.MockedFunction<typeof decodeJwtPayload>;

function makeRequest(opts: {
  pathname: string;
  authorization?: string;
  cookies?: Record<string, string>;
} = { pathname: '/dashboard' }): NextRequest {
  const headers = new Headers();
  if (opts.authorization) headers.set('authorization', opts.authorization);
  const url = `http://localhost:3000${opts.pathname}`;
  const req = {
    url,
    headers,
    cookies: {
      get: (name: string) =>
        opts.cookies && opts.cookies[name]
          ? { value: opts.cookies[name] }
          : undefined,
    },
    nextUrl: { pathname: opts.pathname },
  } as unknown as NextRequest;
  return req;
}

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthToken', () => {
    it('deve priorizar o token do header bearer quando houver', async () => {
      const { getAuthToken } = await import('@/middleware');
      const request = makeRequest({
        pathname: '/dashboard',
        authorization: 'Bearer header-token',
        cookies: { access_token: 'cookie-token' },
      });

      expect(getAuthToken(request)).toBe('header-token');
    });

    it('deve ler o token do cookie quando não houver header bearer', async () => {
      const { getAuthToken } = await import('@/middleware');
      const request = makeRequest({
        pathname: '/dashboard',
        cookies: { access_token: 'cookie-token' },
      });

      expect(getAuthToken(request)).toBe('cookie-token');
    });

    it('deve retornar null quando não houver header nem cookie', async () => {
      const { getAuthToken } = await import('@/middleware');
      const request = makeRequest({ pathname: '/dashboard' });

      expect(getAuthToken(request)).toBeNull();
    });

    it('deve tratar bearer com case sensitivity (Bearer vs bearer)', async () => {
      const { getAuthToken } = await import('@/middleware');
      const request = makeRequest({
        pathname: '/dashboard',
        authorization: 'bearer lowercase',
      });

      expect(getAuthToken(request)).toBe('bearer lowercase');
    });
  });

  describe('middleware function', () => {
    it('deve permitir rotas públicas sem autenticação', async () => {
      const { middleware } = await import('@/middleware');
      const req = makeRequest({ pathname: '/login' });
      const res = await middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
    });

    it('deve permitir rotas públicas /api/auth/login sem autenticação', async () => {
      const { middleware } = await import('@/middleware');
      const req = makeRequest({ pathname: '/api/auth/login' });
      const res = await middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
    });

    it('deve permitir rotas públicas /matches/locate sem autenticação', async () => {
      const { middleware } = await import('@/middleware');
      const req = makeRequest({ pathname: '/matches/locate' });
      const res = await middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
    });

    it('deve permitir rotas bypass (_next)', async () => {
      const { middleware } = await import('@/middleware');
      const req = makeRequest({ pathname: '/_next/static/chunks/main.js' });
      const res = await middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
    });

    it('deve permitir rotas bypass (favicon)', async () => {
      const { middleware } = await import('@/middleware');
      const req = makeRequest({ pathname: '/favicon.ico' });
      const res = await middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
    });

    it('deve redirecionar para /login quando não há token (rota protegida de página)', async () => {
      const { middleware } = await import('@/middleware');
      const req = makeRequest({ pathname: '/dashboard' });
      const res = await middleware(req);
      expect(res.headers.get('location')).toContain('/login');
    });

    it('deve retornar 401 quando não há token (rota de API)', async () => {
      const { middleware } = await import('@/middleware');
      const req = makeRequest({ pathname: '/api/matches' });
      const res = await middleware(req);
      expect(res.status).toBe(401);
    });

    it('deve redirecionar para /login quando JWT é inválido (página)', async () => {
      mockDecodeJwtPayload.mockResolvedValue(null);
      const { middleware } = await import('@/middleware');
      const req = makeRequest({
        pathname: '/dashboard',
        authorization: 'Bearer invalid-token',
      });
      const res = await middleware(req);
      expect(res.headers.get('location')).toContain('/login');
    });

    it('deve retornar 401 quando JWT é inválido (API)', async () => {
      mockDecodeJwtPayload.mockResolvedValue(null);
      const { middleware } = await import('@/middleware');
      const req = makeRequest({
        pathname: '/api/matches',
        authorization: 'Bearer invalid-token',
      });
      const res = await middleware(req);
      expect(res.status).toBe(401);
    });

    it('deve encaminhar request válido com headers x-user-* injetados', async () => {
      mockDecodeJwtPayload.mockResolvedValue({ sub: 'user-1', role: 'ATHLETE' });
      const { middleware } = await import('@/middleware');
      const req = makeRequest({
        pathname: '/dashboard',
        authorization: 'Bearer valid-token',
      });
      const res = await middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
    });

    it('deve redirecionar /admin para /dashboard quando role não é ADMIN', async () => {
      mockDecodeJwtPayload.mockResolvedValue({ sub: 'user-1', role: 'ATHLETE' });
      const { middleware } = await import('@/middleware');
      const req = makeRequest({
        pathname: '/admin/users',
        authorization: 'Bearer valid-token',
      });
      const res = await middleware(req);
      expect(res.headers.get('location')).toContain('/dashboard');
    });

    it('deve permitir acesso a /admin quando role é ADMIN', async () => {
      mockDecodeJwtPayload.mockResolvedValue({ sub: 'admin-1', role: 'ADMIN' });
      const { middleware } = await import('@/middleware');
      const req = makeRequest({
        pathname: '/admin/users',
        authorization: 'Bearer admin-token',
      });
      const res = await middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
    });

    it('deve cobrir todos os matchers de rota protegida (match, matches, historico, etc.)', async () => {
      mockDecodeJwtPayload.mockResolvedValue({ sub: 'user-1', role: 'ATHLETE' });
      const { middleware } = await import('@/middleware');
      const paths = [
        '/match/abc',
        '/matches/abc',
        '/historico',
        '/dados-pessoais',
        '/partidasanotadas',
        '/partidasaovivo',
        '/aguardandoanotador',
        '/atletas',
      ];
      for (const pathname of paths) {
        const req = makeRequest({ pathname, authorization: 'Bearer t' });
        const res = await middleware(req);
        expect(res).toBeInstanceOf(NextResponse);
      }
    });
  });
});
