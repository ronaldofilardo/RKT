import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { POST } from '../route';

jest.mock('@/lib/prisma', () => {
  const tx = {
    user: { create: jest.fn() },
    player: { findFirst: jest.fn(), create: jest.fn() },
    guardianLink: { findFirst: jest.fn(), create: jest.fn() },
    consentRecord: { create: jest.fn() },
    consentEvent: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  return { prisma: { ...tx, user: { ...tx.user, findFirst: jest.fn() }, $transaction: jest.fn(async (cb: any) => cb(tx)), __tx: tx } };
});

jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed-pass') }));

const profile = {
  accessMode: 'BASIC',
  minorName: 'Menor Silva',
  minorBirthDate: '2015-06-10',
  relationship: 'MAE',
  purposes: ['DATA'],
};

function makeRequest(guardianProfile: unknown, role = 'RESPONSAVEL') {
  return new NextRequest('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Mãe Teste',
      identifier: 'mae@example.com',
      password: 'password123',
      role,
      guardianProfile,
    }),
  });
}

describe('A0.21 — POST /api/auth/signup (RESPONSAVEL)', () => {
  const tx = (prisma as any).__tx;

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    tx.user.create.mockResolvedValue({ id: 'u-resp', name: 'Mãe Teste', sessionVersion: 0 });
    tx.player.findFirst.mockResolvedValue(null);
    tx.player.create.mockResolvedValue({ id: 'p-menor' });
    tx.guardianLink.findFirst.mockResolvedValue(null);
    tx.guardianLink.create.mockResolvedValue({ id: 'gl-1' });
    tx.consentRecord.create.mockResolvedValue({ id: 'cr-1' });
    tx.consentEvent.create.mockResolvedValue({ id: 'ce-1' });
    tx.auditLog.create.mockResolvedValue({ id: 'al-1' });
  });

  it('cria conta em modo BASIC com canOperate = false', async () => {
    const res = await POST(makeRequest(profile));
    expect(res.status).toBe(201);

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ canOperate: false, role: 'ANNOTATOR' }) }),
    );
    expect(tx.guardianLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACTIVE', relation: 'MAE', verificationLevel: 'N1_CADASTRO_FAMILIAR' }),
      }),
    );
    const data = await res.json();
    expect(data.role).toBe('RESPONSAVEL');
    expect(data.redirect).toBe('/responsavel');
    expect(data.playerId).toBe('p-menor');
    expect(data.accessMode).toBe('BASIC');
  });

  it('cria conta em modo SPECTATOR com canOperate = true', async () => {
    const res = await POST(makeRequest({ ...profile, accessMode: 'SPECTATOR' }));
    expect(res.status).toBe(201);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ canOperate: true }) }),
    );
  });

  it('registra a tríade DATA obrigatória como ConsentRecord', async () => {
    await POST(makeRequest({ ...profile, purposes: ['DATA', 'BROADCAST'] }));
    expect(tx.consentRecord.create).toHaveBeenCalledTimes(2);
    expect(tx.consentRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ purpose: 'DATA', playerId: 'p-menor' }) }),
    );
    expect(tx.consentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'GRANT', authMethod: 'SIGNUP' }) }),
    );
  });

  it('aborta com 409 MONOTUTELA_CONFLICT quando o menor já tem responsável ativo', async () => {
    tx.guardianLink.findFirst.mockResolvedValue({ id: 'gl-existing' });
    const res = await POST(makeRequest(profile));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('MONOTUTELA_CONFLICT');
    expect(tx.guardianLink.create).not.toHaveBeenCalled();
  });

  it('rejeita payload RESPONSAVEL sem guardianProfile (400)', async () => {
    const res = await POST(makeRequest(undefined));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('menor');
  });

  it('rejeita menor já maior de idade (400)', async () => {
    const res = await POST(makeRequest({ ...profile, minorBirthDate: '1990-01-01' }));
    expect(res.status).toBe(400);
    expect(tx.user.create).not.toHaveBeenCalled();
  });
});
