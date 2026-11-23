import { POST } from '../route';
import { NextRequest } from 'next/server';
import { bumpSessionVersion } from '@/services/accessService';
import { getUserFromRequest } from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/services/accessService', () => ({
  bumpSessionVersion: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth-credentials.logic', () => ({
  getUserFromRequest: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  },
}));

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 200 com sucesso e limpa cookies sem usuário autenticado', async () => {
    (getUserFromRequest as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    const setCookieHeaders = response.headers.get('set-cookie');
    expect(setCookieHeaders).toBeDefined();
    expect(setCookieHeaders).toContain('rkt_access_token=;');
    expect(setCookieHeaders).toContain('access_token=;');
    expect(setCookieHeaders).toContain('user_role=;');
    expect(setCookieHeaders).toContain('Max-Age=0');

    expect(bumpSessionVersion).not.toHaveBeenCalled();
  });

  it('revoga a sessão no servidor com bumpSessionVersion quando o usuário está autenticado', async () => {
    (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-auth-123', role: 'ADMIN' });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { 'user-agent': 'Jest-Agent' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(bumpSessionVersion).toHaveBeenCalledWith('user-auth-123');
  });
});
