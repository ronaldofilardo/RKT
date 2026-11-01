import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  user: { findFirst: jest.fn() },
  membership: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditLog: { create: jest.fn().mockReturnValue(Promise.resolve({})) },
};

describe('createCoach com linkExisting (vinculação de treinador existente)', () => {
  let coachesMod: any;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'u-coach-existing',
      name: 'Carlos Treinador',
      cpf: '11144477735',
      email: 'carlos@teste.com',
    } as any);

    mockPrisma.membership.findFirst.mockResolvedValue(null as any);
    mockPrisma.membership.create.mockResolvedValue({ id: 'm-1' } as any);

    jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }));
    coachesMod = await import('../coaches-logic');
  });

  it('quando linkExisting=false, sinaliza canLinkExisting e o nome do treinador', async () => {
    const result = await coachesMod.createCoach('ct-1', 'u-gestor-1', {
      name: 'Carlos Treinador',
      cpf: '111.444.777-35',
      birthDate: '15/03/1985',
      email: 'carlos@teste.com',
      linkExisting: false,
    });

    expect(result.error).toBe('CONFLICT');
    expect((result as any).canLinkExisting).toBe(true);
    expect((result as any).existingUserName).toBe('Carlos Treinador');
    expect(mockPrisma.membership.create).not.toHaveBeenCalled();
  });

  it('quando linkExisting=true, associa o treinador existente ao CT sem recriar usuário', async () => {
    const result = await coachesMod.createCoach('ct-1', 'u-gestor-1', {
      name: 'Carlos Treinador',
      cpf: '111.444.777-35',
      birthDate: '15/03/1985',
      email: 'carlos@teste.com',
      linkExisting: true,
    });

    expect(result.ok).toBe(true);
    expect(result.isExistingUser).toBe(true);
    expect(result.userId).toBe('u-coach-existing');
    expect(mockPrisma.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u-coach-existing',
          kind: 'TREINADOR',
          ctId: 'ct-1',
          status: 'ACTIVE',
        }),
      }),
    );
  });
});

