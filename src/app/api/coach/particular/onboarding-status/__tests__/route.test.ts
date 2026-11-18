import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as authCredentials from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth-credentials.logic');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: { findFirst: jest.fn() },
  },
}));

describe('GET /api/coach/particular/onboarding-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se não autenticado', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/coach/particular/onboarding-status');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retorna accepted: false se não tiver registro de auditoria', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1' });
    (prisma.auditLog.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/coach/particular/onboarding-status');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accepted).toBe(false);
  });

  it('retorna accepted: true se já aceitou', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1' });
    (prisma.auditLog.findFirst as jest.Mock).mockResolvedValue({ id: 'log-1', createdAt: new Date() });

    const req = new NextRequest('http://localhost:3000/api/coach/particular/onboarding-status');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accepted).toBe(true);
  });
});
