/**
 * Split de playerService.test.ts — describes "findPlayerByEmail" e
 * "getPlayerById": busca por email/id (sucesso e null). Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { findPlayerByEmail, getPlayerById } from '@/services/playerService';
import { playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;

describe('findPlayerByEmail', () => {
  it('deve buscar jogador por email', async () => {
    mockPrisma.player.findFirst.mockResolvedValue(playerRow({ id: 'p1', name: 'Player', email: 'player@test.com' }));

    const result = await findPlayerByEmail('player@test.com');

    expect(mockPrisma.player.findFirst).toHaveBeenCalledWith({
      where: { email: 'player@test.com' },
      select: { id: true, name: true, email: true },
    });
    expect(result?.name).toBe('Player');
  });

  it('deve retornar null quando jogador não existe', async () => {
    mockPrisma.player.findFirst.mockResolvedValue(null);

    const result = await findPlayerByEmail('nobody@test.com');

    expect(result).toBeNull();
  });
});

describe('getPlayerById', () => {
  it('deve buscar jogador por id', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(playerRow({
      id: 'p1', name: 'Player', gender: 'M', age: 25, birthDate: null,
      dominance: 'D', backhand: '1H', ranking: 10, rankings: null, club: null, createdByUserId: 'user-1',
    }));

    const result = await getPlayerById('p1');

    expect(mockPrisma.player.findUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, clubId: true, createdByUserId: true, userId: true, nickname: true, poolVisible: true, poolVisibleSince: true },
    });
    expect(result?.name).toBe('Player');
  });

  it('deve retornar null quando jogador não existe', async () => {
    mockPrisma.player.findUnique.mockResolvedValue(null);

    const result = await getPlayerById('nonexistent');

    expect(result).toBeNull();
  });
});
