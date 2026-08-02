import bcrypt from 'bcryptjs';

const mockPrisma = {
  player: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const mockHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listAllUsers', () => {
    it('deve retornar lista de usuários', async () => {
      mockPrisma.player.findMany.mockResolvedValue([{ id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN', club: null, createdAt: new Date() }]);

      const { listAllUsers } = await import('@/services/adminService');
      const result = await listAllUsers();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Admin');
      expect(mockPrisma.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });
  });

  describe('createUser', () => {
    it('deve criar usuário com sucesso', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed-password' as never);
      mockPrisma.player.create.mockResolvedValue({ id: 'u1', name: 'Novo', email: 'novo@test.com', role: 'ATHLETE', club: 'Clube A', createdAt: new Date() });

      const { createUser } = await import('@/services/adminService');
      const result = await createUser({ name: 'Novo', email: 'novo@test.com', password: '12345678', role: 'ATHLETE', club: 'Clube A' });

      expect('error' in result).toBe(false);
      expect(result.id).toBe('u1');
      expect(mockPrisma.player.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'novo@test.com', passwordHash: 'hashed-password' }),
        })
      );
    });

    it('deve retornar erro se email já existe', async () => {
      mockPrisma.player.findUnique.mockResolvedValue({ id: 'existing' } as any);

      const { createUser } = await import('@/services/adminService');
      const result = await createUser({ name: 'Novo', email: 'duplicado@test.com', password: '12345678', role: 'ATHLETE' });

      expect('error' in result).toBe(true);
      expect((result as any).error).toBe('EMAIL_ALREADY_EXISTS');
      expect(mockPrisma.player.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro se bcrypt falhar', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);
      mockHash.mockRejectedValue(new Error('Bcrypt error'));

      const { createUser } = await import('@/services/adminService');
      await expect(createUser({ name: 'Novo', email: 'novo@test.com', password: '12345678', role: 'ATHLETE' })).rejects.toThrow('Bcrypt error');
    });
  });

  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      mockPrisma.player.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.player.update.mockResolvedValue({ id: 'u1', name: 'Editado', email: 'edit@test.com', role: 'COACH', club: null });

      const { updateUser } = await import('@/services/adminService');
      const result = await updateUser('u1', { name: 'Editado', role: 'COACH' });

      expect('error' in result).toBe(false);
      expect(result.name).toBe('Editado');
      expect(mockPrisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ name: 'Editado', role: 'COACH' }),
        })
      );
    });

    it('deve retornar erro se usuário não existe', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);

      const { updateUser } = await import('@/services/adminService');
      const result = await updateUser('not-found', { name: 'Ninguém' });

      expect('error' in result).toBe(true);
      expect((result as any).error).toBe('USER_NOT_FOUND');
      expect(mockPrisma.player.update).not.toHaveBeenCalled();
    });

    it('deve ignorar campos undefined', async () => {
      mockPrisma.player.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.player.update.mockResolvedValue({ id: 'u1', name: 'Original', email: 'a@b.com', role: 'ATHLETE', club: null });

      const { updateUser } = await import('@/services/adminService');
      await updateUser('u1', { role: 'ATHLETE' });

      expect(mockPrisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: 'ATHLETE' },
        })
      );
    });

    it('deve lançar erro se Prisma update falhar com erro desconhecido', async () => {
      mockPrisma.player.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.player.update.mockRejectedValue(new Error('Prisma unknown error'));

      const { updateUser } = await import('@/services/adminService');
      await expect(updateUser('u1', { name: 'Edit' })).rejects.toThrow('Prisma unknown error');
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      mockPrisma.player.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.player.delete.mockResolvedValue({} as any);

      const { deleteUser } = await import('@/services/adminService');
      const result = await deleteUser('u1');

      expect((result as any).success).toBe(true);
      expect(mockPrisma.player.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('deve retornar erro se usuário não existe', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);

      const { deleteUser } = await import('@/services/adminService');
      const result = await deleteUser('not-found');

      expect('error' in result).toBe(true);
      expect((result as any).error).toBe('USER_NOT_FOUND');
      expect(mockPrisma.player.delete).not.toHaveBeenCalled();
    });
  });
});
