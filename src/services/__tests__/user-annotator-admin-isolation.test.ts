/**
 * Testes de Isolamento e Perfis:
 * 1. Anotador cria, visualiza, edita e deleta suas partidas
 * 2. Anotador A não tem acesso às partidas de Anotador B
 * 3. Admin não tem acesso às partidas dos anotadores
 * 4. Atletas são catálogo compartilhado
 * 5. Autenticação via e-mail e CPF
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  match: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  player: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Isolamento de Partidas e Perfis (Admin vs Anotador)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMatches (Isolamento por Anotador)', () => {
    it('deve retornar apenas as partidas do próprio anotador', async () => {
      const { listMatches } = await import('@/services/matchRepository');

      const fakeMatches = [
        { id: 'match-1', createdByUserId: 'anotador-1' },
      ];
      mockPrisma.match.findMany.mockResolvedValue(fakeMatches as any);

      const result = await listMatches(null, null, 20, 'anotador-1');

      expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdByUserId: 'anotador-1',
            deletedAt: null,
          }),
        })
      );
      expect(result).toHaveLength(1);
    });

    it('deve retornar lista vazia quando o usuário for Admin (sem createdByUserId)', async () => {
      const { listMatches } = await import('@/services/matchRepository');

      // Admin não passa createdByUserId de anotador
      const result = await listMatches(null, null, 20, null);

      // Nem consulta o banco de partidas de anotadores
      expect(mockPrisma.match.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('Catálogo Compartilhado de Atletas (Player)', () => {
    it('deve listar todos os atletas do catálogo sem restringir por anotador', async () => {
      const { listPlayers } = await import('@/services/playerService');

      mockPrisma.player.findMany.mockResolvedValue([
        { id: 'p1', name: 'Carlos Alcaraz' },
        { id: 'p2', name: 'Jannik Sinner' },
      ] as any);

      // Chamada sem userId retorna o catálogo global
      const result = await listPlayers(null, 20);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Carlos Alcaraz');
    });
  });

  describe('Autenticação por E-mail ou CPF', () => {
    it('deve buscar por e-mail se contiver arroba', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('12345678', 10);
      const { authenticateUser } = await import('@/app/api/auth/login/authenticate');

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Anotador',
        email: 'anotador@rkt.com',
        cpf: '11111111111',
        role: 'ANNOTATOR',
        passwordHash,
        isActive: true,
      } as any);

      const user = await authenticateUser('anotador@rkt.com', '12345678');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'anotador@rkt.com' },
      });
      expect(user?.role).toBe('ANNOTATOR');
    });

    it('deve buscar por CPF se não contiver arroba, limpando máscara', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('12345678', 10);
      const { authenticateUser } = await import('@/app/api/auth/login/authenticate');

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Admin',
        email: 'admin@rkt.com',
        cpf: '00000000000',
        role: 'ADMIN',
        passwordHash,
        isActive: true,
      } as any);

      const user = await authenticateUser('000.000.000-00', '12345678');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { cpf: '00000000000' },
      });
      expect(user?.role).toBe('ADMIN');
    });
  });
});
