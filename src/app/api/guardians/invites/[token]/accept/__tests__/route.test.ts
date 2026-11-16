jest.mock('@/lib/prisma', () => ({
  prisma: {
    guardianInvite: { findUnique: jest.fn() },
    guardianLink: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth-credentials.logic', () => ({
  getAccessUserFromRequest: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { POST } from '../route';

const mockGetUser = getAccessUserFromRequest as jest.MockedFunction<typeof getAccessUserFromRequest>;

describe('POST /api/guardians/invites/[token]/accept', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validInvite = {
    id: 'inv-1',
    playerId: 'p-minor',
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    usedAt: null,
    preGuardianCpfHash: 'cpf-hash-1',
    player: { id: 'p-minor', userId: 'u-minor', name: 'Atleta Menor' },
  };

  it('retorna 401 se não estiver autenticado', async () => {
    mockGetUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(401);
  });

  it('retorna 404 se convite não existir ou já tiver sido utilizado', async () => {
    mockGetUser.mockResolvedValue({ id: 'u-parent', role: 'ANNOTATOR' });
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(404);
  });

  it('retorna 410 se convite tiver expirado', async () => {
    mockGetUser.mockResolvedValue({ id: 'u-parent', role: 'ANNOTATOR' });
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue({
      ...validInvite,
      expiresAt: new Date(Date.now() - 1000),
    });
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(410);
  });

  it('retorna 403 se o próprio atleta tentar aceitar seu convite (autotutela proibida)', async () => {
    mockGetUser.mockResolvedValue({ id: 'u-minor', role: 'ANNOTATOR' });
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(validInvite);
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('SELF_GUARDIAN_PROHIBITED');
  });

  it('retorna 409 se o atleta já possuir responsável legal ativo (Monotutela Estrita)', async () => {
    mockGetUser.mockResolvedValue({ id: 'u-parent', role: 'ANNOTATOR' });
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(validInvite);
    ((prisma as any).guardianLink.findFirst as jest.Mock).mockResolvedValue({ id: 'gl-active', status: 'ACTIVE' });
    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/accept', {
      method: 'POST',
      body: JSON.stringify({ relationship: 'PAI', purposes: ['DATA'] }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('MONOTUTELA_CONFLICT');
  });

  it('confirma tutela e registra consentimentos na transação', async () => {
    mockGetUser.mockResolvedValue({ id: 'u-parent', role: 'ANNOTATOR' });
    ((prisma as any).guardianInvite.findUnique as jest.Mock).mockResolvedValue(validInvite);
    ((prisma as any).guardianLink.findFirst as jest.Mock).mockResolvedValue(null);

    const txMock = {
      guardianInvite: { update: jest.fn() },
      guardianLink: { create: jest.fn() },
      consentRecord: { create: jest.fn() },
      consentEvent: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    ((prisma as any).$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(txMock));

    const req = new NextRequest('http://localhost/api/guardians/invites/tok-1/accept', {
      method: 'POST',
      body: JSON.stringify({ relationship: 'PAI', purposes: ['DATA', 'BROADCAST', 'STATS'] }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: 'tok-1' }) });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(txMock.guardianInvite.update).toHaveBeenCalled();
    expect(txMock.guardianLink.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ verificationLevel: 'N2_PRE_VALIDADO' }) })
    );
    expect(txMock.consentRecord.create).toHaveBeenCalledTimes(3);
    expect(txMock.consentRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ termsVersion: '2.0' }) })
    );
    expect(txMock.consentEvent.create).toHaveBeenCalledTimes(3);
  });
});
