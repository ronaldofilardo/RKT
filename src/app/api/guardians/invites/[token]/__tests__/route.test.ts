jest.mock('@/lib/prisma', () => ({
  prisma: {
    guardianInvite: { findUnique: jest.fn() },
  },
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '../route';

describe('GET /api/guardians/invites/[token]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 se o convite não existir ou já tiver sido utilizado', async () => {
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1');
    const res = await GET(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(404);
  });

  it('retorna 410 se o convite tiver expirado', async () => {
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue({
      expiresAt: new Date(Date.now() - 5000),
      revokedAt: null,
      usedAt: null,
      player: { id: 'p1', name: 'Atleta Menor' },
      ct: { id: 'ct1', name: 'CT Tenis' },
    });
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1');
    const res = await GET(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(410);
  });

  it('retorna os dados do atleta menor e do CT com CPF mascarado', async () => {
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue({
      expiresAt: new Date(Date.now() + 50000),
      revokedAt: null,
      usedAt: null,
      preGuardianName: 'Carlos Silva',
      preGuardianCpf: '52998224725',
      player: { id: 'p1', name: 'Lucas Silva', birthDate: new Date('2012-05-10') },
      ct: { id: 'ct1', name: 'CT Morumbi Tennis' },
    });
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1');
    const res = await GET(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.minorName).toBe('Lucas Silva');
    expect(body.trainingCenterName).toBe('CT Morumbi Tennis');
    expect(body.preGuardianName).toBe('Carlos Silva');
    expect(body.hasPreRegisteredCpf).toBe(true);
    expect(body.preGuardianCpfMasked).toBe('529.***.***-25');
  });
});
