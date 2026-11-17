/**
 * Split de playerService.test.ts — describe "updatePlayer": campos especiais
 * (rankings como JSON e birthDate). Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { updatePlayer } from '@/services/playerService';
import { callArgs, playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;

describe('updatePlayer — campos especiais', () => {
  it('deve atualizar rankings como JSON', async () => {
    const rankings = { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } };

    mockPrisma.player.update.mockResolvedValue(playerRow({ id: 'p1', name: 'Player', rankings }));

    await updatePlayer('p1', { rankings });

    const args = callArgs(mockPrisma.player.update);
    expect(args.data.rankings).toEqual(rankings);
  });

  it('deve atualizar birthDate', async () => {
    const birthDate = new Date('1995-06-15');

    mockPrisma.player.update.mockResolvedValue(playerRow({ id: 'p1', name: 'Player', birthDate }));

    await updatePlayer('p1', { birthDate });

    const args = callArgs(mockPrisma.player.update);
    expect(args.data.birthDate).toEqual(birthDate);
  });
});
