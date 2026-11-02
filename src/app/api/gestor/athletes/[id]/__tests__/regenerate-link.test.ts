import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  playerCT: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  user: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  player: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  membership: { findMany: jest.fn() },
  coachAthleteLink: { createMany: jest.fn() },
  auditLog: { create: jest.fn() },
  linkInvite: { create: jest.fn() },
  passwordResetRequest: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (_req: any, _act: any, _res: any, handler: any) =>
    handler({ user: { id: 'u-gestor-1' } }),
}));
jest.mock('../../../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn(),
}));

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/gestor/athletes/p-1/regenerate-link', {
    method: 'POST',
  });
}

function mockExistingAccount() {
  (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
    id: 'pct-1',
    playerId: 'p-1',
    ctId: 'ct-1',
    player: {
      id: 'p-1',
      name: 'Atleta Com Conta',
      cpf: '52998224725',
      email: null,
      birthDate: new Date('1985-03-15T00:00:00.000Z'),
      userId: 'u-1',
      user: { id: 'u-1', email: 'atleta@email.com' },
    },
  });
  (mockPrisma.linkInvite.create as any).mockResolvedValue({});
  (mockPrisma.passwordResetRequest.findFirst as any).mockResolvedValue(null);
  (mockPrisma.passwordResetRequest.create as any).mockResolvedValue({});
  (mockPrisma.user.update as any).mockResolvedValue({});
}

function mockAthleteWithoutAccount(overrides: Partial<Record<string, unknown>> = {}) {
  const record = {
    id: 'pct-2',
    playerId: 'p-2',
    ctId: 'ct-1',
    player: {
      id: 'p-2',
      name: 'Marcos',
      cpf: '52998224725',
      email: null,
      birthDate: new Date('1990-07-04T00:00:00.000Z'),
      userId: null,
      user: null,
      ...overrides,
    },
  };
  (mockPrisma.playerCT.findFirst as any).mockResolvedValue(record);
  (mockPrisma.user.findFirst as any).mockResolvedValue(null);
  (mockPrisma.$transaction as any).mockImplementation(async (fn: any) => fn(mockPrisma));
  (mockPrisma.user.create as any).mockResolvedValue({ id: 'u-novo', email: '52998224725@local' });
  (mockPrisma.player.update as any).mockResolvedValue({});
  (mockPrisma.linkInvite.create as any).mockResolvedValue({});
  (mockPrisma.passwordResetRequest.findFirst as any).mockResolvedValue(null);
  (mockPrisma.passwordResetRequest.create as any).mockResolvedValue({});
  (mockPrisma.user.update as any).mockResolvedValue({});
  return record;
}

function mockLinkSideEffects() {
  (mockPrisma.player.findFirst as any).mockResolvedValue(null);
  (mockPrisma.playerCT.findFirst as any).mockResolvedValue(null);
  (mockPrisma.playerCT.create as any).mockResolvedValue({});
  (mockPrisma.membership.findMany as any).mockResolvedValue([]);
  (mockPrisma.coachAthleteLink.createMany as any).mockResolvedValue({ count: 0 });
  (mockPrisma.auditLog.create as any).mockResolvedValue({});
}

describe('POST /api/gestor/athletes/[id]/regenerate-link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gera o link para atleta com conta sem criar nova conta', async () => {
    mockExistingAccount();

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-1' }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toEqual(expect.any(String));
    expect(data.message).toContain('regenerado');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.linkInvite.create).toHaveBeenCalled();
  });

  it('cria a conta de acesso do atleta sem conta antes de emitir o link', async () => {
    mockAthleteWithoutAccount();

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-2' }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toEqual(expect.any(String));

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Marcos',
          email: '52998224725@local',
          cpf: '52998224725',
          role: 'ANNOTATOR',
          canOperate: true,
          mustChangePassword: true,
        }),
      }),
    );
    expect(mockPrisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p-2' },
      data: { userId: 'u-novo', identityStatus: 'CONFIRMED' },
    });
    expect(mockPrisma.linkInvite.create).toHaveBeenCalled();
  });

  it('vincula a conta existente com o mesmo CPF e emite o link de senha', async () => {
    const record = mockAthleteWithoutAccount();
    mockLinkSideEffects();
    (mockPrisma.playerCT.findFirst as any).mockResolvedValueOnce(record).mockResolvedValue(null);
    (mockPrisma.user.findFirst as any).mockResolvedValue({
      id: 'u-existente',
      name: 'Coah Carter',
      email: 'coach@rkt.com',
      cpf: '52998224725',
    });

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-2' }) });

    expect(res.status).toBe(200);
    expect((await res.json()).token).toEqual(expect.any(String));
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p-2' },
      data: { userId: 'u-existente', identityStatus: 'CONFIRMED' },
    });
    expect(mockPrisma.playerCT.create).toHaveBeenCalledWith({
      data: { playerId: 'p-2', ctId: 'ct-1', status: 'ACTIVE' },
    });
    expect(mockPrisma.linkInvite.create).toHaveBeenCalled();
  });

  it('retorna 404 quando não há vínculo do atleta com o clube', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue(null);

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-x' }) });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('NOT_FOUND');
    expect(data.message).toBe('Vínculo de atleta não encontrado');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('orienta a completar a data de nascimento quando ela falta', async () => {
    mockAthleteWithoutAccount({ birthDate: null });

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-2' }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('data de nascimento');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('orienta a completar o CPF quando ele falta', async () => {
    mockAthleteWithoutAccount({ cpf: null });

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-2' }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('CPF');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('retorna 409 quando a conta já está vinculada a outro atleta', async () => {
    mockAthleteWithoutAccount();
    (mockPrisma.user.findFirst as any).mockResolvedValue({
      id: 'u-existente',
      name: 'Outro Atleta',
      email: 'outro@rkt.com',
      cpf: '52998224725',
    });
    (mockPrisma.player.findFirst as any).mockResolvedValue({ id: 'p-outro' });

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-2' }) });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('CONFLICT');
    expect(data.message).toContain('outro atleta');
    expect(mockPrisma.player.update).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('retorna 409 quando o e-mail do atleta pertence a outra conta', async () => {
    mockAthleteWithoutAccount();
    (mockPrisma.user.findFirst as any).mockResolvedValue({
      id: 'u-outro',
      name: 'Outro',
      email: '52998224725@local',
      cpf: '11122233344',
    });

    const { POST } = await import('../regenerate-link/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'p-2' }) });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('CONFLICT');
    expect(data.message).toContain('outra conta');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});
