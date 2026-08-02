jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    it('deve extrair role do JWT e autorizar', async () => {
      const { requireRole } = await import('@/lib/auth');

      mockJwtVerify.mockResolvedValue({
        payload: { role: 'ADMIN', sub: 'user-1' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      });

      const result = await requireRole(req, 'ATHLETE');
      expect(result).toBeNull();
    });

    it('deve rejeitar x-user-role forjado e usar JWT real', async () => {
      const { requireRole } = await import('@/lib/auth');

      mockJwtVerify.mockResolvedValue({
        payload: { role: 'SPECTATOR', sub: 'user-1' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer valid-token',
          'x-user-role': 'ADMIN',
        },
      });

      const result = await requireRole(req, 'COACH');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('deve retornar 401 sem token', async () => {
      const { requireRole } = await import('@/lib/auth');

      const req = new NextRequest('http://localhost:3000/api/test');

      const result = await requireRole(req, 'ATHLETE');
      expect(result?.status).toBe(401);
    });

    it('deve retornar 401 para token inválido', async () => {
      const { requireRole } = await import('@/lib/auth');

      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer bad-token' },
      });

      const result = await requireRole(req, 'ATHLETE');
      expect(result?.status).toBe(401);
    });

    it('deve retornar 403 se role é insuficiente', async () => {
      const { requireRole } = await import('@/lib/auth');

      mockJwtVerify.mockResolvedValue({
        payload: { role: 'SPECTATOR', sub: 'user-1' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      });

      const result = await requireRole(req, 'COACH');
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
      const data = await result!.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('deve validar hierarquia: ADMIN pode acessar tudo', async () => {
      const { requireRole } = await import('@/lib/auth');

      mockJwtVerify.mockResolvedValue({
        payload: { role: 'ADMIN', sub: 'admin-1' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer admin-token' },
      });

      const result = await requireRole(req, 'SPECTATOR');
      expect(result).toBeNull();
    });

    it('deve validar hierarquia: GESTOR pode acessar ATHLETE', async () => {
      const { requireRole } = await import('@/lib/auth');

      mockJwtVerify.mockResolvedValue({
        payload: { role: 'GESTOR', sub: 'gestor-1' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer gestor-token' },
      });

      const result = await requireRole(req, 'ATHLETE');
      expect(result).toBeNull();
    });

    it('deve falhar se GESTOR tenta acessar ADMIN', async () => {
      const { requireRole } = await import('@/lib/auth');

      mockJwtVerify.mockResolvedValue({
        payload: { role: 'GESTOR', sub: 'gestor-1' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer gestor-token' },
      });

      const result = await requireRole(req, 'ADMIN');
      expect(result?.status).toBe(403);
    });
  });

  describe('getUserFromRequest', () => {
    it('deve extrair do JWT', async () => {
      const { getUserFromRequest } = await import('@/lib/auth');

      mockJwtVerify.mockResolvedValue({
        payload: { role: 'COACH', sub: 'user-1' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      });

      const user = await getUserFromRequest(req);
      expect(user).not.toBeNull();
      expect(user!.id).toBe('user-1');
      expect(user!.role).toBe('COACH');
    });

    it('deve retornar null para id se token é inválido', async () => {
      const { getUserFromRequest } = await import('@/lib/auth');

      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer invalid-token' },
      });

      const user = await getUserFromRequest(req);
      expect(user).toBeNull();
    });

    it('deve retornar null sem token', async () => {
      const { getUserFromRequest } = await import('@/lib/auth');

      const req = new NextRequest('http://localhost:3000/api/test');

      const user = await getUserFromRequest(req);
      expect(user).toBeNull();
    });
  });
});
