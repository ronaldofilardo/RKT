jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: { findUnique: jest.fn(), update: jest.fn() },
    match: { updateMany: jest.fn() },
    playerCT: { updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (ops) => {
      const results = [];
      for (const op of ops) {
        results.push(await op);
      }
      return results;
    }),
  },
}));

import { prisma } from '@/lib/prisma';
import { mergePlayers } from '../player-merge.logic';

const mockPrismaPlayerFindUnique = prisma.player.findUnique as jest.MockedFunction<any>;
const mockPrismaPlayerUpdate = prisma.player.update as jest.MockedFunction<any>;
const mockPrismaMatchUpdateMany = prisma.match.updateMany as jest.MockedFunction<any>;
const mockPrismaPlayerCTUpdateMany = prisma.playerCT.updateMany as jest.MockedFunction<any>;
const mockPrismaAuditLogCreate = prisma.auditLog.create as jest.MockedFunction<any>;
const mockPrismaTransaction = (prisma as any)['$transaction'] as jest.MockedFunction<any>;

describe('player-merge.logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('faz merge completo transferindo partidas, PlayerCTs e auditLog', async () => {
    mockPrismaPlayerFindUnique
      .mockResolvedValueOnce({ id: 'source-1', name: 'Fonte', mergedIntoId: null })
      .mockResolvedValueOnce({ id: 'target-1', name: 'Alvo', mergedIntoId: null });
    mockPrismaTransaction.mockResolvedValue([]);

    const result = await mergePlayers({ sourceId: 'source-1', targetId: 'target-1', actorUserId: 'u-admin' });

    expect(result).toEqual({ sourceId: 'source-1', targetId: 'target-1', mergedIntoId: 'target-1' });
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);

    const ops = mockPrismaTransaction.mock.calls[0][0];
    expect(ops).toHaveLength(7);

    expect(mockPrismaMatchUpdateMany).toHaveBeenCalledWith({
      where: { player1Id: 'source-1' },
      data: { player1Id: 'target-1' },
    });
    expect(mockPrismaMatchUpdateMany).toHaveBeenCalledWith({
      where: { player2Id: 'source-1' },
      data: { player2Id: 'target-1' },
    });
    expect(mockPrismaMatchUpdateMany).toHaveBeenCalledWith({
      where: { player1PartnerId: 'source-1' },
      data: { player1PartnerId: 'target-1' },
    });
    expect(mockPrismaMatchUpdateMany).toHaveBeenCalledWith({
      where: { player2PartnerId: 'source-1' },
      data: { player2PartnerId: 'target-1' },
    });

    expect(mockPrismaPlayerCTUpdateMany).toHaveBeenCalledWith({
      where: { playerId: 'source-1' },
      data: { playerId: 'target-1' },
    });

    expect(mockPrismaPlayerUpdate).toHaveBeenCalledWith({
      where: { id: 'source-1' },
      data: { mergedIntoId: 'target-1' },
    });

    expect(mockPrismaAuditLogCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: 'u-admin',
        action: 'player:merge',
        resourceType: 'Player',
        resourceId: 'target-1',
        meta: { sourceId: 'source-1', targetId: 'target-1', sourceName: 'Fonte', targetName: 'Alvo' },
      },
    });
  });

  it('lanc erro quando source nao existe', async () => {
    mockPrismaPlayerFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'target-1', name: 'Target', mergedIntoId: null });
    await expect(mergePlayers({ sourceId: 'inexistente', targetId: 'target-1', actorUserId: 'u-admin' }))
      .rejects.toThrow('PLAYER_NOT_FOUND');
  });

  it('lanc erro quando target nao existe', async () => {
    mockPrismaPlayerFindUnique
      .mockResolvedValueOnce({ id: 'source-1', name: 'Source', mergedIntoId: null })
      .mockResolvedValueOnce(null);
    await expect(mergePlayers({ sourceId: 'source-1', targetId: 'inexistente', actorUserId: 'u-admin' }))
      .rejects.toThrow('PLAYER_NOT_FOUND');
  });

  it('lanc erro quando source e target sao iguais', async () => {
    await expect(mergePlayers({ sourceId: 'mesmo', targetId: 'mesmo', actorUserId: 'u-admin' }))
      .rejects.toThrow('SAME_PLAYER');
    expect(mockPrismaPlayerFindUnique).not.toHaveBeenCalled();
  });

  it('lanc erro quando source ja foi mesclado', async () => {
    mockPrismaPlayerFindUnique
      .mockResolvedValueOnce({ id: 'source-1', name: 'Fonte', mergedIntoId: 'outro' })
      .mockResolvedValueOnce({ id: 'target-1', name: 'Alvo', mergedIntoId: null });
    await expect(mergePlayers({ sourceId: 'source-1', targetId: 'target-1', actorUserId: 'u-admin' }))
      .rejects.toThrow('ALREADY_MERGED');
  });
});
