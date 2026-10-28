import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { POST } from '../route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: { findUnique: jest.fn() },
    athleteClaim: { findFirst: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('@/lib/auth-credentials.logic', () => ({
  getAccessUserFromRequest: jest.fn(),
}));

describe('Characterization: POST /api/athlete-claims (remediado na Fase 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejeita chamada sem autenticacao com 401 (vulnerabilidade P1 corrigida)', async () => {
    (getAccessUserFromRequest as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/athlete-claims', {
      method: 'POST',
      body: JSON.stringify({ userId: 'target-user-id', playerId: 'target-player-id' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('permite criar claim quando autenticado e deriva userId da sessao', async () => {
    (getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'auth-user-id', role: 'ANNOTATOR' });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: null });
    (prisma.athleteClaim.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.athleteClaim.create as jest.Mock).mockResolvedValue({
      id: 'claim-1',
      userId: 'auth-user-id',
      playerId: 'p1',
      status: 'PENDING',
    });

    const req = new NextRequest('http://localhost:3000/api/athlete-claims', {
      method: 'POST',
      body: JSON.stringify({ playerId: 'p1', userId: 'spoofed-id' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.athleteClaim.create).toHaveBeenCalledWith({
      data: { userId: 'auth-user-id', playerId: 'p1', status: 'PENDING' },
    });
  });
});
