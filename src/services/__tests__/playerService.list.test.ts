/**
 * Split de playerService.test.ts — describe "listPlayers": listagem ordenada,
 * paginação por cursor e filtro por userId (criador/treinador ativo). Asserções 1:1.
 */
jest.mock('@/lib/prisma', () => require('./playerServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { listPlayers } from '@/services/playerService';
import { playerRow } from './playerServiceTestKit';

const mockPrisma = prisma as any;

describe('listPlayers', () => {
  it('deve listar jogadores ordenados por nome', async () => {
    mockPrisma.player.findMany.mockResolvedValue([
      playerRow({ id: 'p1', name: 'Ana', club: null }),
      playerRow({ id: 'p2', name: 'Bruno', club: null }),
    ]);

    const result = await listPlayers(null, 20);

    expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
      take: 20,
      select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, clubId: true, city: true, state: true, createdAt: true, createdByUserId: true, nickname: true, cpf: true, cpfLast2: true, user: { select: { cpf: true, mustChangePassword: true } }, playerCts: { select: { ctId: true } } },
      orderBy: { name: 'asc' },
      where: {},
    });
    expect(result).toHaveLength(2);
  });

  it('deve usar cursor quando fornecido', async () => {
    mockPrisma.player.findMany.mockResolvedValue([]);

    await listPlayers('cursor-abc', 10);

    expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 1,
        cursor: { id: 'cursor-abc' },
      }),
    );
  });

  it('deve filtrar por userId (criador ou vínculo de treinador ativo) quando fornecido', async () => {
    mockPrisma.player.findMany.mockResolvedValue([]);

    await listPlayers(null, 20, 'user-123');

    expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { createdByUserId: 'user-123' },
            { coachAthleteLinks: { some: { coachUserId: 'user-123', status: 'ACTIVE' } } },
          ],
        },
      }),
    );
  });
});
