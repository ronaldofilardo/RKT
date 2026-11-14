import { tryResolveExistingPlayer } from '../player-create-existing.logic';
import { prisma } from '@/lib/prisma';
import { ConflictError } from '@/lib/errors';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    playerCT: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('../player-create-links.logic', () => ({
  handlePlayerPostCreate: jest.fn().mockResolvedValue(undefined),
}));

describe('tryResolveExistingPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('re-vincula e atualiza atleta já existente quando não ativo no CT', async () => {
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({
      id: 'p-1', name: 'Juca', nickname: 'jukinha', rankings: {},
    });
    (prisma.playerCT.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.playerCT.create as jest.Mock).mockResolvedValue({ id: 'pct-1' });
    (prisma.player.update as jest.Mock).mockResolvedValue({
      id: 'p-1', name: 'Juca Atualizado', nickname: 'jukinha',
    });

    const result = await tryResolveExistingPlayer({
      nickname: 'jukinha',
      data: {
        name: 'Juca Atualizado',
        rankingsPayload: {},
        cpfHash: null,
        cpfLast2: null,
        myClub: true,
        ctId: 'ct-1',
      },
    });

    expect(prisma.playerCT.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { playerId: 'p-1', ctId: 'ct-1', status: 'ACTIVE' } })
    );
    expect(result?.name).toBe('Juca Atualizado');
  });

  it('re-ativa vínculo quando PlayerCT existia inativo', async () => {
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({ id: 'p-1', nickname: 'jukinha' });
    (prisma.playerCT.findFirst as jest.Mock).mockResolvedValue({ id: 'pct-1', status: 'INACTIVE' });
    (prisma.playerCT.update as jest.Mock).mockResolvedValue({ id: 'pct-1', status: 'ACTIVE' });
    (prisma.player.update as jest.Mock).mockResolvedValue({ id: 'p-1', nickname: 'jukinha' });

    await tryResolveExistingPlayer({
      nickname: 'jukinha',
      data: { name: 'Juca', rankingsPayload: {}, cpfHash: null, cpfLast2: null, myClub: true, ctId: 'ct-1' },
    });

    expect(prisma.playerCT.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pct-1' }, data: { status: 'ACTIVE', endedAt: null } })
    );
  });

  it('lança ConflictError quando atleta já está ativo no clube', async () => {
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({ id: 'p-1', nickname: 'jukinha' });
    (prisma.playerCT.findFirst as jest.Mock).mockResolvedValue({ id: 'pct-1', status: 'ACTIVE' });

    await expect(
      tryResolveExistingPlayer({
        nickname: 'jukinha',
        data: { name: 'Juca', rankingsPayload: {}, cpfHash: null, cpfLast2: null, myClub: true, ctId: 'ct-1' },
      })
    ).rejects.toThrow(ConflictError);
  });

  it('lança ConflictError quando !myClub e apelido já existe', async () => {
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({ id: 'p-1', nickname: 'jukinha' });

    await expect(
      tryResolveExistingPlayer({
        nickname: 'jukinha',
        data: { name: 'Juca', rankingsPayload: {}, cpfHash: null, cpfLast2: null, myClub: false },
      })
    ).rejects.toThrow(ConflictError);
  });
});
