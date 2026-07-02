jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

describe('playerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listPlayers', () => {
    it('deve listar jogadores ordenados por nome', async () => {
      const { listPlayers } = await import('@/services/playerService');

      mockPrisma.player.findMany.mockResolvedValue([
        { id: 'p1', name: 'Ana', gender: null, age: null, dominance: null, backhand: null, ranking: null },
        { id: 'p2', name: 'Bruno', gender: null, age: null, dominance: null, backhand: null, ranking: null },
      ]);

      const result = await listPlayers(null, 20);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        take: 20,
        select: { id: true, name: true, gender: true, age: true, dominance: true, backhand: true, ranking: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('deve usar cursor quando fornecido', async () => {
      const { listPlayers } = await import('@/services/playerService');

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
  });

  describe('findPlayerByEmail', () => {
    it('deve buscar jogador por email', async () => {
      const { findPlayerByEmail } = await import('@/services/playerService');

      mockPrisma.player.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Player',
        email: 'player@test.com',
        role: 'COACH',
        passwordHash: 'hash',
      });

      const result = await findPlayerByEmail('player@test.com');

      expect(mockPrisma.player.findUnique).toHaveBeenCalledWith({
        where: { email: 'player@test.com' },
        select: { id: true, name: true, email: true, role: true, passwordHash: true },
      });
      expect(result?.name).toBe('Player');
    });

    it('deve retornar null quando jogador não existe', async () => {
      const { findPlayerByEmail } = await import('@/services/playerService');

      mockPrisma.player.findUnique.mockResolvedValue(null);

      const result = await findPlayerByEmail('nobody@test.com');

      expect(result).toBeNull();
    });
  });

  describe('createPlayer', () => {
    it('deve criar jogador com nome e email', async () => {
      const { createPlayer } = await import('@/services/playerService');

      mockPrisma.player.create.mockResolvedValue({
        id: 'p1',
        name: 'Novo',
        gender: null,
        age: null,
        dominance: null,
        backhand: null,
        ranking: null,
      });

      const result = await createPlayer({ name: 'Novo', email: 'novo@test.com', passwordHash: 'hash123' });

      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: {
          name: 'Novo',
          email: 'novo@test.com',
          passwordHash: 'hash123',
          gender: undefined,
          age: undefined,
          dominance: undefined,
          backhand: undefined,
          ranking: undefined,
        },
        select: { id: true, name: true, gender: true, age: true, dominance: true, backhand: true, ranking: true },
      });
    });

    it('deve usar email placeholder quando não fornecido', async () => {
      const { createPlayer } = await import('@/services/playerService');

      mockPrisma.player.create.mockResolvedValue({
        id: 'p2',
        name: 'Sem Email',
        gender: null,
        age: null,
        dominance: null,
        backhand: null,
        ranking: null,
      });

      await createPlayer({ name: 'Sem Email' });

      expect(mockPrisma.player.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Sem Email',
            passwordHash: 'PLACEHOLDER',
          }),
        }),
      );

      const callArgs = mockPrisma.player.create.mock.calls[0][0];
      expect(callArgs.data.email).toMatch(/^temp_.*@placeholder\.local$/);
    });
  });
});
