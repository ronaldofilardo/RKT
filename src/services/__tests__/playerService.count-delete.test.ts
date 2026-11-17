/**
 * Split de playerService.test.ts — describes "countPlayerActiveMatches" e
 * "deletePlayer": contagem de partidas ativas por estado e exclusão por id.
 * Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { countPlayerActiveMatches, deletePlayer } from '@/services/playerService';
import { playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;

describe('countPlayerActiveMatches', () => {
  it('deve agrupar partidas ativas por estado', async () => {
    mockPrisma.match.groupBy.mockResolvedValue([
      { state: 'IN_PROGRESS', _count: { _all: 2 } },
      { state: 'FINISHED', _count: { _all: 1 } },
    ]);

    const result = await countPlayerActiveMatches('p1');

    expect(mockPrisma.match.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['state'],
        where: {
          deletedAt: null,
          OR: [{ player1Id: 'p1' }, { player2Id: 'p1' }],
        },
      }),
    );
    expect(result).toEqual([
      { state: 'IN_PROGRESS', count: 2 },
      { state: 'FINISHED', count: 1 },
    ]);
  });
});

describe('deletePlayer', () => {
  it('deve excluir jogador pelo id', async () => {
    mockPrisma.player.delete.mockResolvedValue(playerRow({ id: 'p1', name: 'Fulano' }));

    const result = await deletePlayer('p1');

    expect(mockPrisma.player.delete).toHaveBeenCalledWith({
      where: { id: 'p1' },
    });
    expect(result.name).toBe('Fulano');
  });
});
