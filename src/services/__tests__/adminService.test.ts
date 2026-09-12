import bcrypt from 'bcryptjs';

const mockPrisma = {
  user: {
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
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', name: 'Admin', email: 'admin@test.com', cpf: '00000000000', role: 'ADMIN', club: null, createdAt: new Date() },
      ]);

      const { listAllUsers } = await import('@/services/adminService');
      const result = await listAllUsers();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Admin');
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });
  });

  describe('createUser', () => {
    it('deve criar usuário com sucesso', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed-password' as never);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        name: 'Novo',
        email: 'novo@test.com',
        cpf: '11111111111',
        role: 'ANNOTATOR',
        club: 'Clube A',
        createdAt: new Date(),
      });

      const { createUser } = await import('@/services/adminService');
      const result = await createUser({
        name: 'Novo',
        email: 'novo@test.com',
        cpf: '11111111111',
        password: '12345678',
        role: 'ANNOTATOR',
        club: 'Clube A',
      });

      expect('error' in result).toBe(false);
      expect((result as any).id).toBe('u1');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'novo@test.com', passwordHash: 'hashed-password' }),
        })
      );
    });

    it('deve retornar erro se email já existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing' } as any);

      const { createUser } = await import('@/services/adminService');
      const result = await createUser({
        name: 'Novo',
        email: 'duplicado@test.com',
        cpf: '11111111111',
        password: '12345678',
        role: 'ANNOTATOR',
      });

      expect('error' in result).toBe(true);
      expect((result as any).error).toBe('EMAIL_ALREADY_EXISTS');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro se bcrypt falhar', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockHash.mockRejectedValue(new Error('Bcrypt error'));

      const { createUser } = await import('@/services/adminService');
      await expect(
        createUser({
          name: 'Novo',
          email: 'novo@test.com',
          cpf: '11111111111',
          password: '12345678',
          role: 'ANNOTATOR',
        })
      ).rejects.toThrow('Bcrypt error');
    });

    it('deve retornar EMAIL_ALREADY_EXISTS se Prisma lançar erro P2002 (race condition)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed-password' as never);
      const p2002Error = new Error('Unique constraint failed');
      (p2002Error as any).code = 'P2002';
      mockPrisma.user.create.mockRejectedValue(p2002Error);

      const { createUser } = await import('@/services/adminService');
      const result = await createUser({
        name: 'Novo',
        email: 'corrida@test.com',
        cpf: '11111111111',
        password: '12345678',
        role: 'ANNOTATOR',
      });

      expect('error' in result).toBe(true);
      expect((result as any).error).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.user.update.mockResolvedValue({
        id: 'u1',
        name: 'Editado',
        email: 'edit@test.com',
        role: 'ANNOTATOR',
        club: null,
      });

      const { updateUser } = await import('@/services/adminService');
      const result = await updateUser('u1', { name: 'Editado', role: 'ANNOTATOR' });

      expect('error' in result).toBe(false);
      expect((result as any).name).toBe('Editado');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ name: 'Editado', role: 'ANNOTATOR' }),
        })
      );
    });

    it('deve retornar erro se usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { updateUser } = await import('@/services/adminService');
      const result = await updateUser('not-found', { name: 'Ninguém' });

      expect('error' in result).toBe(true);
      expect((result as any).error).toBe('USER_NOT_FOUND');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('deve ignorar campos undefined', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.user.update.mockResolvedValue({
        id: 'u1',
        name: 'Original',
        email: 'a@b.com',
        role: 'ANNOTATOR',
        club: null,
      });

      const { updateUser } = await import('@/services/adminService');
      await updateUser('u1', { role: 'ANNOTATOR' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: 'ANNOTATOR' },
        })
      );
    });

    it('deve lançar erro se Prisma update falhar com erro desconhecido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.user.update.mockRejectedValue(new Error('Prisma unknown error'));

      const { updateUser } = await import('@/services/adminService');
      await expect(updateUser('u1', { name: 'Edit' })).rejects.toThrow('Prisma unknown error');
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockPrisma.user.delete.mockResolvedValue({} as any);

      const { deleteUser } = await import('@/services/adminService');
      const result = await deleteUser('u1');

      expect((result as any).success).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('deve retornar erro se usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { deleteUser } = await import('@/services/adminService');
      const result = await deleteUser('not-found');

      expect('error' in result).toBe(true);
      expect((result as any).error).toBe('USER_NOT_FOUND');
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
