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

describe('Secured: POST /api/athlete-claims (P1 remediation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se nao autenticado', async () => {
    (getAccessUserFromRequest as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/athlete-claims', {
      method: 'POST',
      body: JSON.stringify({ playerId: 'p1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 404 se atleta nao existe', async () => {
    (getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ANNOTATOR' });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/athlete-claims', {
      method: 'POST',
      body: JSON.stringify({ playerId: 'p-inexistente' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('retorna 409 se atleta ja tem conta vinculada a outro usuario', async () => {
    (getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ANNOTATOR' });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'outro-user' });

    const req = new NextRequest('http://localhost:3000/api/athlete-claims', {
      method: 'POST',
      body: JSON.stringify({ playerId: 'p1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('ignora userId forjado no body e grava claim estritamente com user autenticado', async () => {
    (getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u-auth', role: 'ANNOTATOR' });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: null });
    (prisma.athleteClaim.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.athleteClaim.create as jest.Mock).mockResolvedValue({
      id: 'claim-1',
      userId: 'u-auth',
      playerId: 'p1',
      status: 'PENDING',
    });

    const req = new NextRequest('http://localhost:3000/api/athlete-claims', {
      method: 'POST',
      body: JSON.stringify({ playerId: 'p1', userId: 'spoofed-admin-id' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.athleteClaim.create).toHaveBeenCalledWith({
      data: { userId: 'u-auth', playerId: 'p1', status: 'PENDING' },
    });
  });
});

