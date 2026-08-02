jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
        { id: 'p1', name: 'Ana', gender: null, age: null, birthDate: null, dominance: null, backhand: null, ranking: null, rankings: null },
        { id: 'p2', name: 'Bruno', gender: null, age: null, birthDate: null, dominance: null, backhand: null, ranking: null, rankings: null },
      ]);

      const result = await listPlayers(null, 20);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        take: 20,
        select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
        orderBy: { name: 'asc' },
        where: {},
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

    it('deve filtrar por userId quando fornecido', async () => {
      const { listPlayers } = await import('@/services/playerService');

      mockPrisma.player.findMany.mockResolvedValue([]);

      await listPlayers(null, 20, 'user-123');

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdByUserId: 'user-123' },
        }),
      );
    });
  });

  describe('createPlayer - birthDate', () => {
    it('deve criar jogador com birthDate', async () => {
      const { createPlayer } = await import('@/services/playerService');

      const mockBirthDate = new Date('1999-03-15');
      mockPrisma.player.create.mockResolvedValue({
        id: 'p1',
        name: 'Novo',
        gender: 'MALE',
        age: 25,
        birthDate: mockBirthDate,
        dominance: 'RIGHT',
        backhand: 'ONE_HANDED',
        ranking: 10,
        rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
      });

      const result = await createPlayer({
        name: 'Novo',
        email: 'novo@test.com',
        passwordHash: 'hash123',
        gender: 'MALE',
        age: 25,
        birthDate: mockBirthDate,
        dominance: 'RIGHT',
        backhand: 'ONE_HANDED',
        ranking: 10,
        rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
      });

      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Novo',
          email: 'novo@test.com',
          passwordHash: 'hash123',
          gender: 'MALE',
          age: 25,
          birthDate: mockBirthDate,
          dominance: 'RIGHT',
          backhand: 'ONE_HANDED',
          ranking: 10,
          rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
        }),
        select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
      });
      expect(result.birthDate).toEqual(mockBirthDate);
    });

    it('deve criar jogador sem birthDate quando não fornecido', async () => {
      const { createPlayer } = await import('@/services/playerService');

      mockPrisma.player.create.mockResolvedValue({
        id: 'p1',
        name: 'Sem Data',
        gender: null,
        age: null,
        birthDate: null,
        dominance: null,
        backhand: null,
        ranking: null,
        rankings: null,
      });

      await createPlayer({ name: 'Sem Data' });

      const callArgs = mockPrisma.player.create.mock.calls[0][0];
      expect(callArgs.data.birthDate).toBeUndefined();
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
        birthDate: null,
        dominance: null,
        backhand: null,
        ranking: null,
        rankings: null,
      });

      const result = await createPlayer({ name: 'Novo', email: 'novo@test.com', passwordHash: 'hash123' });

      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: {
          name: 'Novo',
          email: 'novo@test.com',
          passwordHash: 'hash123',
          gender: undefined,
          age: undefined,
          birthDate: undefined,
          dominance: undefined,
          backhand: undefined,
          ranking: undefined,
          rankings: undefined,
          createdByUserId: undefined,
        },
        select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
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

  describe('getPlayerById', () => {
    it('deve buscar jogador por id', async () => {
      const { getPlayerById } = await import('@/services/playerService');

      mockPrisma.player.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Player',
        gender: 'M',
        age: 25,
        birthDate: null,
        dominance: 'D',
        backhand: '1H',
        ranking: 10,
        rankings: null,
        createdByUserId: 'user-1',
      });

      const result = await getPlayerById('p1');

      expect(mockPrisma.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
        select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, createdByUserId: true },
      });
      expect(result?.name).toBe('Player');
    });

    it('deve retornar null quando jogador não existe', async () => {
      const { getPlayerById } = await import('@/services/playerService');

      mockPrisma.player.findUnique.mockResolvedValue(null);

      const result = await getPlayerById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updatePlayer', () => {
    it('deve atualizar campos do jogador', async () => {
      const { updatePlayer } = await import('@/services/playerService');

      mockPrisma.player.update.mockResolvedValue({
        id: 'p1',
        name: 'Updated',
        gender: 'F',
        age: 30,
        birthDate: null,
        dominance: 'E',
        backhand: '2H',
        ranking: 5,
        rankings: null,
      });

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
        select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
      });
      expect(result.name).toBe('Updated');
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const { updatePlayer } = await import('@/services/playerService');

      mockPrisma.player.update.mockResolvedValue({
        id: 'p1',
        name: 'Only Name Changed',
        gender: null,
        age: null,
        birthDate: null,
        dominance: null,
        backhand: null,
        ranking: null,
        rankings: null,
      });

      await updatePlayer('p1', { name: 'Only Name Changed' });

      const callArgs = mockPrisma.player.update.mock.calls[0][0];
      expect(callArgs.data).toEqual({ name: 'Only Name Changed' });
    });

    it('deve atualizar rankings como JSON', async () => {
      const { updatePlayer } = await import('@/services/playerService');

      const rankings = { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } };

      mockPrisma.player.update.mockResolvedValue({
        id: 'p1',
        name: 'Player',
        gender: null,
        age: null,
        birthDate: null,
        dominance: null,
        backhand: null,
        ranking: null,
        rankings,
      });

      await updatePlayer('p1', { rankings });

      const callArgs = mockPrisma.player.update.mock.calls[0][0];
      expect(callArgs.data.rankings).toEqual(rankings);
    });

    it('deve atualizar birthDate', async () => {
      const { updatePlayer } = await import('@/services/playerService');

      const birthDate = new Date('1995-06-15');

      mockPrisma.player.update.mockResolvedValue({
        id: 'p1',
        name: 'Player',
        gender: null,
        age: null,
        birthDate,
        dominance: null,
        backhand: null,
        ranking: null,
        rankings: null,
      });

      await updatePlayer('p1', { birthDate });

      const callArgs = mockPrisma.player.update.mock.calls[0][0];
      expect(callArgs.data.birthDate).toEqual(birthDate);
    });
  });
});