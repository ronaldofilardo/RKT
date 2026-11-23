import { authenticateUserDetailed, authenticateUser } from '../authenticate';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    player: {
      findFirst: jest.fn(),
    },
  },
}));

describe('authenticate.ts — Autenticação de credenciais', () => {
  const fakePasswordHash = '$2a$10$FakeHashedPasswordStringForTesting';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna USER_NOT_FOUND para identificador vazio', async () => {
    const res = await authenticateUserDetailed('   ', 'senha123');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.reason).toBe('USER_NOT_FOUND');
    }
  });

  it('retorna USER_NOT_FOUND quando usuário não é encontrado no banco', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await authenticateUserDetailed('naoexiste@rkt.com', 'senha123');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.reason).toBe('USER_NOT_FOUND');
    }
  });

  it('retorna USER_INACTIVE quando conta está desativada', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u-inactive',
      email: 'inativo@rkt.com',
      isActive: false,
      passwordHash: fakePasswordHash,
    });

    const res = await authenticateUserDetailed('inativo@rkt.com', 'senha123');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.reason).toBe('USER_INACTIVE');
    }
  });

  it('retorna sucesso quando a senha bate com o hash bcrypt', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u-ok',
      email: 'ok@rkt.com',
      isActive: true,
      passwordHash: fakePasswordHash,
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const res = await authenticateUserDetailed('ok@rkt.com', 'senhaCorreta');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.user.id).toBe('u-ok');
    }

    const simple = await authenticateUser('ok@rkt.com', 'senhaCorreta');
    expect(simple?.id).toBe('u-ok');
  });

  it('V-03: rejeita estritamente fallback de senha por data de nascimento (DDMMYYYY)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u-atleta',
      email: 'atleta@rkt.com',
      isActive: true,
      passwordHash: fakePasswordHash,
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
    (prisma.player.findFirst as jest.Mock).mockResolvedValue({
      birthDate: new Date('2010-05-15T00:00:00.000Z'),
    });

    // Tentativa usando data de nascimento "15052010"
    const res = await authenticateUserDetailed('atleta@rkt.com', '15052010');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.reason).toBe('INVALID_PASSWORD');
    }

    // Garante que o banco nem sequer consulta a tabela Player para buscar data de nascimento
    expect(prisma.player.findFirst).not.toHaveBeenCalled();
  });
});
