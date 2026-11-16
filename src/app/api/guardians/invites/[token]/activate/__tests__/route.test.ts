jest.mock('@/lib/prisma', () => ({
  prisma: {
    guardianInvite: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password-123'),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST } from '../route';

describe('POST /api/guardians/invites/[token]/activate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validInvite = {
    id: 'inv-1',
    expiresAt: new Date(Date.now() + 100000),
    revokedAt: null,
    guardianUser: { id: 'user-guardian-1', name: 'Pai do Atleta', cpf: '52998224725' },
  };

  it('retorna 404 se convite não existir ou estiver revogado', async () => {
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/activate', {
      method: 'POST',
      body: JSON.stringify({ password: 'Password123' }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(404);
  });

  it('ativa conta em modo BASIC com canOperate: false', async () => {
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(validInvite);
    ((prisma as any).user.update as jest.Mock).mockResolvedValue({ id: 'user-guardian-1' });

    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/activate', {
      method: 'POST',
      body: JSON.stringify({ password: 'SecretPassword123', accessMode: 'BASIC' }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.canOperate).toBe(false);
    expect((prisma as any).user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ canOperate: false, passwordHash: 'hashed-password-123' }) })
    );
  });

  it('ativa conta em modo SPECTATOR com canOperate: true', async () => {
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(validInvite);
    ((prisma as any).user.update as jest.Mock).mockResolvedValue({ id: 'user-guardian-1' });

    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/activate', {
      method: 'POST',
      body: JSON.stringify({ password: 'SecretPassword123', accessMode: 'SPECTATOR' }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.canOperate).toBe(true);
    expect((prisma as any).user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ canOperate: true }) })
    );
  });
});
