import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  player: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  playerCT: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  membership: { findMany: jest.fn() },
  coachAthleteLink: { createMany: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(async (fn: any) => fn(mockPrisma)),
};

const existingUser = {
  id: 'u-existing',
  name: 'Coah Carter',
  email: 'coach@rkt.com',
  cpf: '63983014046',
};

describe('linkExistingAthleteAccount (vinculação de atleta existente)', () => {
  let linkMod: any;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockPrisma.player.findFirst.mockResolvedValue(null);
    mockPrisma.playerCT.findFirst.mockResolvedValue(null);
    mockPrisma.playerCT.create.mockResolvedValue({ id: 'pct-new' });
    mockPrisma.playerCT.update.mockResolvedValue({});
    mockPrisma.player.create.mockResolvedValue({ id: 'u-existing-player' });
    mockPrisma.player.update.mockResolvedValue({});
    mockPrisma.membership.findMany.mockResolvedValue([{ userId: 'u-coach-1' }]);
    mockPrisma.coachAthleteLink.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.auditLog.create.mockResolvedValue({});

    jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }));
    linkMod = await import('../athletes-link.logic');
  });

  it('associa a conta existente ao atleta do clube sem recriar usuário', async () => {
    const result = await linkMod.linkExistingAthleteAccount({
      ctId: 'ct-1',
      issuedByUserId: 'u-gestor-1',
      existingUser,
      playerId: 'p-2',
    });

    expect(result.ok).toBe(true);
    expect(result.isExistingUser).toBe(true);
    expect(result.userId).toBe('u-existing');
    expect(result.playerId).toBe('p-2');
    expect(mockPrisma.player.create).not.toHaveBeenCalled();
    expect(mockPrisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p-2' },
      data: { userId: 'u-existing', identityStatus: 'CONFIRMED' },
    });
  });

  it('faz o atleta pertencer ao clube: PlayerCT nasce/re-nasce ACTIVE', async () => {
    await linkMod.linkExistingAthleteAccount({
      ctId: 'ct-1',
      issuedByUserId: 'u-gestor-1',
      existingUser,
      playerId: 'p-2',
    });

    expect(mockPrisma.playerCT.create).toHaveBeenCalledWith({
      data: { playerId: 'p-2', ctId: 'ct-1', status: 'ACTIVE' },
    });
    expect(mockPrisma.coachAthleteLink.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ coachUserId: 'u-coach-1', playerId: 'p-2', status: 'ACTIVE' })],
      }),
    );
  });

  it('reativa um vínculo de PlayerCT encerrado em vez de duplicar', async () => {
    mockPrisma.playerCT.findFirst.mockResolvedValue({ id: 'pct-old' });

    const result = await linkMod.linkExistingAthleteAccount({
      ctId: 'ct-1',
      issuedByUserId: 'u-gestor-1',
      existingUser,
      playerId: 'p-2',
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.playerCT.create).not.toHaveBeenCalled();
    expect(mockPrisma.playerCT.update).toHaveBeenCalledWith({
      where: { id: 'pct-old' },
      data: { status: 'ACTIVE', endedAt: null },
    });
  });

  it('cria o Player da conta quando ela ainda não tem atleta', async () => {
    const result = await linkMod.linkExistingAthleteAccount({
      ctId: 'ct-1',
      issuedByUserId: 'u-gestor-1',
      existingUser,
      athlete: { birthDate: '2015-01-01', gender: 'MASCULINO', laterality: 'DESTRO' },
    });

    expect(result.ok).toBe(true);
    expect(result.playerId).toBe('u-existing-player');
    expect(mockPrisma.player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Coah Carter',
          cpf: '63983014046',
          userId: 'u-existing',
          createdByUserId: 'u-gestor-1',
          gender: 'MASCULINO',
          dominance: 'DESTRO',
        }),
      }),
    );
    expect(mockPrisma.player.update).not.toHaveBeenCalled();
  });

  it('recusa quando a conta já pertence a outro atleta', async () => {
    mockPrisma.player.findFirst.mockResolvedValue({ id: 'p-owner' });

    const result = await linkMod.linkExistingAthleteAccount({
      ctId: 'ct-1',
      issuedByUserId: 'u-gestor-1',
      existingUser,
      playerId: 'p-2',
    });

    expect(result.error).toBe('CONFLICT');
    expect(result.status).toBe(409);
    expect(result.message).toContain('outro atleta');
    expect(mockPrisma.player.update).not.toHaveBeenCalled();
    expect(mockPrisma.playerCT.create).not.toHaveBeenCalled();
  });
});
