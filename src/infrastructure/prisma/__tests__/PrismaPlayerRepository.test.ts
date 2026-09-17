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

import { PrismaPlayerRepository } from '../PrismaPlayerRepository';
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

describe('PrismaPlayerRepository', () => {
  let repository: PrismaPlayerRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaPlayerRepository();
  });

  describe('list', () => {
    it('deve listar jogadores com parametros padrao', async () => {
      const mockPlayers = [{ id: 'p1', name: 'Ana' }];
      mockPrisma.player.findMany.mockResolvedValue(mockPlayers);

      const result = await repository.list();

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        take: 20,
        where: {},
        select: expect.objectContaining({ id: true, name: true }),
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockPlayers);
    });

    it('deve usar cursor quando fornecido', async () => {
      mockPrisma.player.findMany.mockResolvedValue([]);

      await repository.list('cursor-abc', 10);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 1,
          cursor: { id: 'cursor-abc' },
        })
      );
    });

    it('deve filtrar por userId quando fornecido', async () => {
      mockPrisma.player.findMany.mockResolvedValue([]);

      await repository.list(null, 20, 'user-1');

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdByUserId: 'user-1' },
        })
      );
    });

    it('deve usar take = limit fornecido', async () => {
      mockPrisma.player.findMany.mockResolvedValue([]);

      await repository.list(null, 50);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe('findById', () => {
    it('deve retornar jogador por id', async () => {
      const mockPlayer = { id: 'p1', name: 'Ana', createdByUserId: 'u1' };
      mockPrisma.player.findUnique.mockResolvedValue(mockPlayer);

      const result = await repository.findById('p1');

      expect(mockPrisma.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
        select: expect.objectContaining({ id: true, name: true, createdByUserId: true }),
      });
      expect(result).toEqual(mockPlayer);
    });

    it('deve retornar null quando jogador não existe', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar jogador com dados completos', async () => {
      const input = {
        name: 'Carlos',
        email: 'c@test.com',
        club: 'Lima CC',
        gender: 'MALE' as const,
        age: 25,
        birthDate: new Date('2001-01-01'),
        dominance: 'RIGHT' as const,
        backhand: 'TWO_HANDED' as const,
        ranking: 1500,
        createdByUserId: 'u1',
      };
      const mockCreated = { id: 'p-new', ...input };
      mockPrisma.player.create.mockResolvedValue(mockCreated);

      const result = await repository.create(input);

      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Carlos',
          email: 'c@test.com',
          club: 'Lima CC',
          gender: 'MALE',
          age: 25,
          birthDate: input.birthDate,
          dominance: 'RIGHT',
          backhand: 'TWO_HANDED',
          ranking: 1500,
          createdByUserId: 'u1',
        }),
        select: expect.objectContaining({ id: true, name: true }),
      });
      expect(result).toEqual(mockCreated);
    });

    it('deve usar null para email e club quando não fornecidos', async () => {
      const input = {
        name: 'Ana',
        gender: 'FEMALE' as const,
        age: 30,
        birthDate: new Date('1996-01-01'),
        dominance: 'LEFT' as const,
        backhand: 'ONE_HANDED' as const,
        ranking: 1200,
        createdByUserId: 'u1',
      };
      mockPrisma.player.create.mockResolvedValue({ id: 'p-new', ...input });

      await repository.create(input);

      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: null,
          club: null,
        }),
        select: expect.anything(),
      });
    });

    it('deve incluir rankings quando fornecido', async () => {
      const input = {
        name: 'Bob',
        gender: 'MALE' as const,
        age: 20,
        birthDate: new Date('2006-01-01'),
        dominance: 'RIGHT' as const,
        backhand: 'TWO_HANDED' as const,
        ranking: 1000,
        rankings: [{ type: 'NATIONAL', rank: 50 }],
        createdByUserId: 'u1',
      };
      mockPrisma.player.create.mockResolvedValue({ id: 'p-new', ...input });

      await repository.create(input);

      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rankings: [{ type: 'NATIONAL', rank: 50 }],
        }),
        select: expect.anything(),
      });
    });
  });

  describe('update', () => {
    it('deve atualizar campos fornecidos', async () => {
      const mockUpdated = { id: 'p1', name: 'Ana Updated' };
      mockPrisma.player.update.mockResolvedValue(mockUpdated);

      const result = await repository.update('p1', { name: 'Ana Updated' });

      expect(mockPrisma.player.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: expect.objectContaining({ name: 'Ana Updated' }),
        select: expect.objectContaining({ id: true, name: true }),
      });
      expect(result).toEqual(mockUpdated);
    });

    it('nao deve incluir campos undefined no data', async () => {
      mockPrisma.player.update.mockResolvedValue({ id: 'p1' });

      await repository.update('p1', { name: 'X', email: undefined });

      const callData = mockPrisma.player.update.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('email');
    });

    it('deve atualizar rankings quando fornecido', async () => {
      mockPrisma.player.update.mockResolvedValue({ id: 'p1' });

      await repository.update('p1', { rankings: [{ type: 'LOCAL', rank: 10 }] });

      expect(mockPrisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rankings: [{ type: 'LOCAL', rank: 10 }],
          }),
        })
      );
    });
  });
});
