jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { resolveGuardianUser } from '../accept-validation.logic';

describe('resolveGuardianUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prioriza cleanedCpf mesmo se houver sessionUser de outro usuário', async () => {
    const sessionUser = { id: 'other-user-logged-in' };
    const guardianCpf = '52998224725';
    ((prisma.user.findUnique as jest.Mock)).mockResolvedValue({ id: 'target-guardian-user', cpf: guardianCpf });

    const result = await resolveGuardianUser(sessionUser, 'Pai Real', guardianCpf);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { cpf: guardianCpf } });
    expect(result).toEqual({ id: 'target-guardian-user' });
  });

  it('cria novo usuário para o responsável se não existir com aquele CPF', async () => {
    const sessionUser = { id: 'gestor-session' };
    const guardianCpf = '52998224725';
    ((prisma.user.findUnique as jest.Mock)).mockResolvedValue(null);
    ((prisma.user.create as jest.Mock)).mockResolvedValue({ id: 'new-guardian-user', cpf: guardianCpf });

    const result = await resolveGuardianUser(sessionUser, 'Pai Novo', guardianCpf);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: guardianCpf,
          name: 'Pai Novo',
        }),
      }),
    );
    expect(result).toEqual({ id: 'new-guardian-user' });
  });

  it('usa sessionUser apenas se nenhum CPF for informado', async () => {
    const sessionUser = { id: 'existing-session' };
    const result = await resolveGuardianUser(sessionUser, null, null);
    expect(result).toEqual({ id: 'existing-session' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('retorna null se não houver CPF nem sessionUser', async () => {
    const result = await resolveGuardianUser(null, null, null);
    expect(result).toBeNull();
  });
});
