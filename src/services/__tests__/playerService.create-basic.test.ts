/**
 * Split de playerService.test.ts — describe "createPlayer": payload básico
 * (nome+email, club/createdByUserId) e email null quando não informado. Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { createPlayer } from '@/services/playerService';
import { playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;

describe('createPlayer', () => {
  it('deve criar jogador com nome e email', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p1', name: 'Novo' }));

    const result = await createPlayer({ name: 'Novo', email: 'novo@test.com' });

    expect(mockPrisma.player.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Novo',
        email: 'novo@test.com',
        club: null,
        createdByUserId: undefined,
      }),
      select: expect.objectContaining({
        id: true, name: true, gender: true, age: true, birthDate: true,
        dominance: true, backhand: true, ranking: true, rankings: true, club: true,
        cpfHash: true, cpfLast2: true, identityStatus: true, athleteCode: true,
        userId: true, createdByUserId: true,
      }),
    });
  });

  it('deve definir null no email quando não fornecido', async () => {
    mockPrisma.player.create.mockResolvedValue(playerRow({ id: 'p2', name: 'Sem Email' }));

    await createPlayer({ name: 'Sem Email' });

    expect(mockPrisma.player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Sem Email',
          email: null,
        }),
      }),
    );
  });
});
