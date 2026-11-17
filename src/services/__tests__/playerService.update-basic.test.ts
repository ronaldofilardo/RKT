/**
 * Split de playerService.test.ts — describe "updatePlayer": atualização dos
 * campos básicos e atualização apenas dos campos fornecidos. Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { updatePlayer } from '@/services/playerService';
import { callArgs, playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;

describe('updatePlayer — campos básicos', () => {
  it('deve atualizar campos do jogador', async () => {
    mockPrisma.player.update.mockResolvedValue(playerRow({
      id: 'p1', name: 'Updated', gender: 'F', age: 30, birthDate: null,
      dominance: 'E', backhand: '2H', ranking: 5, rankings: null,
    }));

    const result = await updatePlayer('p1', {
      name: 'Updated',
      gender: 'F',
      age: 30,
      dominance: 'E',
      backhand: '2H',
      ranking: 5,
    });

    expect(mockPrisma.player.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: {
        name: 'Updated',
        gender: 'F',
        age: 30,
        dominance: 'E',
        backhand: '2H',
        ranking: 5,
      },
      select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, nickname: true },
    });
    expect(result.name).toBe('Updated');
  });

  it('deve atualizar apenas campos fornecidos', async () => {
    mockPrisma.player.update.mockResolvedValue(playerRow({ id: 'p1', name: 'Only Name Changed' }));

    await updatePlayer('p1', { name: 'Only Name Changed' });

    const args = callArgs(mockPrisma.player.update);
    expect(args.data).toEqual({ name: 'Only Name Changed' });
  });
});
