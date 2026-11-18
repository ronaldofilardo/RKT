import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth-credentials.logic';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    guardianLink: {
      findFirst: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-credentials.logic', () => ({
  getUserFromRequest: jest.fn(),
}));

describe('GET /api/guardians/me/dependents/[id]/access-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 403 se o usuário não for o responsável ativo do menor', async () => {
    (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (prisma.guardianLink.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/guardians/me/dependents/p-1/access-logs');
    const res = await GET(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(403);
  });

  it('retorna logs e dados da conta quando vinculado com sucesso', async () => {
    (getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (prisma.guardianLink.findFirst as jest.Mock).mockResolvedValue({
      id: 'gl-1',
      player: {
        id: 'p-1',
        name: 'Menor',
        user: {
          id: 'minor-u-1',
          email: 'menor@local',
          mustChangePassword: false,
          createdAt: new Date('2026-11-10T10:00:00Z'),
        },
      },
    });

    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'al-1',
        action: 'USER_LOGIN',
        createdAt: new Date('2026-11-18T08:00:00Z'),
        meta: { userAgent: 'Chrome Mobile' },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/guardians/me/dependents/p-1/access-logs');
    const res = await GET(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.account.hasAccount).toBe(true);
    expect(json.account.email).toBe('menor@local');
    expect(json.logs).toHaveLength(1);
    expect(json.logs[0].action).toBe('USER_LOGIN');
  });
});
