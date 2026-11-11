import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  player: { findUnique: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn() },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

describe('ensureAthleteUserAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.player.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.findUnique as any).mockResolvedValue(null);
    (mockPrisma.user.create as any).mockResolvedValue({ id: 'u-novo-1' });
    (mockPrisma.player.update as any).mockResolvedValue({});
  });

  it('cria conta de usuário com placeholder único de CPF quando atleta não possui CPF', async () => {
    const { ensureAthleteUserAccount } = await import('../athlete-provision.logic');
    const res = await ensureAthleteUserAccount({
      playerId: 'p-sem-cpf',
      name: 'Atleta Sem CPF',
      birthDate: new Date('2005-06-15T00:00:00.000Z'),
    });

    expect(res.userId).toBe('u-novo-1');
    expect(res.isNewUser).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Atleta Sem CPF',
          cpf: 'PROV_p-sem-cpf',
          role: 'ANNOTATOR',
          mustChangePassword: true,
        }),
      }),
    );
  });

  it('cria conta de usuário com o CPF real quando fornecido (11 dígitos)', async () => {
    const { ensureAthleteUserAccount } = await import('../athlete-provision.logic');
    const res = await ensureAthleteUserAccount({
      playerId: 'p-com-cpf',
      name: 'Atleta Com CPF',
      cpf: '123.456.789-00',
      birthDate: new Date('2005-06-15T00:00:00.000Z'),
    });

    expect(res.userId).toBe('u-novo-1');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: '12345678900',
        }),
      }),
    );
  });

  it('reutiliza userId se o atleta já possuir conta vinculada', async () => {
    (mockPrisma.player.findUnique as any).mockResolvedValue({ userId: 'u-existente' });
    const { ensureAthleteUserAccount } = await import('../athlete-provision.logic');
    const res = await ensureAthleteUserAccount({
      playerId: 'p-ja-tem-conta',
      name: 'Atleta Já Vinculado',
    });

    expect(res.userId).toBe('u-existente');
    expect(res.isNewUser).toBe(false);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});
