jest.mock('@/lib/prisma', () => ({
  prisma: { user: { update: jest.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { buildIdentityUpdate } from '../player-put-identity.logic';

const mockUserUpdate = prisma.user.update as jest.Mock;

describe('buildIdentityUpdate', () => {
  beforeEach(() => {
    mockUserUpdate.mockReset();
    mockUserUpdate.mockResolvedValue({});
  });

  it('grava nome e CPF no User quando o atleta tem conta de acesso', async () => {
    const data = await buildIdentityUpdate({ userId: 'user-1', name: 'Ana', cpf: '529.982.247-25' });

    expect(data).toEqual({});
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Ana', cpf: '52998224725' },
    });
  });

  it('não mexe nos campos de CPF do Player quando existe conta', async () => {
    const data = await buildIdentityUpdate({ userId: 'user-1', cpf: '52998224725' });
    expect(data).toEqual({});
  });

  it('devolve campos de CPF do Player quando o atleta não tem conta', async () => {
    const data = await buildIdentityUpdate({ userId: null, cpf: '529.982.247-25' });

    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(data).toEqual(
      expect.objectContaining({ cpf: '52998224725', cpfLast2: '25', cpfHash: expect.any(String) }),
    );
  });

  it('não altera nada quando não há nome nem CPF', async () => {
    const data = await buildIdentityUpdate({ userId: 'user-1' });
    expect(data).toEqual({});
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});
