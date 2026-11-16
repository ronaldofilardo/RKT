jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: { findFirst: jest.fn() },
    guardianLink: { findFirst: jest.fn() },
    guardianInvite: { count: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('@/lib/auth-credentials.logic', () => ({
  getAccessUserFromRequest: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { POST } from '../route';

const mockGetAccessUser = getAccessUserFromRequest as jest.MockedFunction<typeof getAccessUserFromRequest>;

describe('POST /api/minors/me/guardian-invite', () => {
  const minorBirth = new Date('2012-05-10');
  const adultBirth = new Date('1990-01-01');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se usuário não estiver autenticado', async () => {
    mockGetAccessUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/minors/me/guardian-invite', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 se o atleta não for menor de idade', async () => {
    mockGetAccessUser.mockResolvedValue({ id: 'u-adult', role: 'ANNOTATOR' });
    ((prisma as any).player.findFirst as jest.Mock).mockResolvedValue({ id: 'p-adult', birthDate: adultBirth });
    const req = new NextRequest('http://localhost/api/minors/me/guardian-invite', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('NOT_A_MINOR');
  });

  it('retorna 409 por Monotutela Estrita se já houver responsável legal ativo', async () => {
    mockGetAccessUser.mockResolvedValue({ id: 'u-minor', role: 'ANNOTATOR' });
    ((prisma as any).player.findFirst as jest.Mock).mockResolvedValue({ id: 'p-minor', birthDate: minorBirth });
    ((prisma as any).guardianLink.findFirst as jest.Mock).mockResolvedValue({ id: 'gl-1', status: 'ACTIVE' });
    const req = new NextRequest('http://localhost/api/minors/me/guardian-invite', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('MONOTUTELA_CONFLICT');
  });

  it('retorna 429 se exceder o limite de 3 convites em 24h', async () => {
    mockGetAccessUser.mockResolvedValue({ id: 'u-minor', role: 'ANNOTATOR' });
    ((prisma as any).player.findFirst as jest.Mock).mockResolvedValue({ id: 'p-minor', birthDate: minorBirth });
    ((prisma as any).guardianLink.findFirst as jest.Mock).mockResolvedValue(null);
    ((prisma as any).guardianInvite.count as jest.Mock).mockResolvedValue(3);
    const req = new NextRequest('http://localhost/api/minors/me/guardian-invite', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('gera convite único com aviso de monotutela e revoga convites pendentes anteriores', async () => {
    mockGetAccessUser.mockResolvedValue({ id: 'u-minor', role: 'ANNOTATOR' });
    ((prisma as any).player.findFirst as jest.Mock).mockResolvedValue({ id: 'p-minor', birthDate: minorBirth });
    ((prisma as any).guardianLink.findFirst as jest.Mock).mockResolvedValue(null);
    ((prisma as any).guardianInvite.count as jest.Mock).mockResolvedValue(1);
    ((prisma as any).guardianInvite.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    ((prisma as any).guardianInvite.create as jest.Mock).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/minors/me/guardian-invite', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.token).toEqual(expect.any(String));
    expect(data.warning).toContain('Apenas 1 responsável');
    expect((prisma as any).guardianInvite.updateMany).toHaveBeenCalled();
    expect((prisma as any).guardianInvite.create).toHaveBeenCalled();
  });
});
