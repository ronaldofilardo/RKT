import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  membership: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  player: {
    create: jest.fn(),
  },
  playerCT: {
    create: jest.fn(),
  },
  passwordResetRequest: {
    create: jest.fn(),
  },
  coachAthleteLink: {
    createMany: jest.fn(),
  },
  $transaction: jest.fn(async (fn: any) => fn(mockPrisma)),
};

let coachesMod: any;
let athletesMod: any;

describe('createCoach', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'u-coach-1',
      name: 'Treinador Teste',
      email: 'treinador@teste.com',
      cpf: '11144477735',
    });
    mockPrisma.membership.create.mockResolvedValue({});
    mockPrisma.passwordResetRequest.create.mockResolvedValue({});

    jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }));
    coachesMod = await import('../coaches-logic');
  });

  it('cria treinador com sucesso', async () => {
    const result = await coachesMod.createCoach(
      'ct-1',
      'u-gestor-1',
      {
        name: 'Treinador Teste',
        cpf: '111.444.777-35',
        birthDate: '15/03/1985',
        email: 'treinador@teste.com',
      },
    );
    expect((result as any).ok).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: '11144477735',
          mustChangePassword: true,
          canOperate: true,
        }),
      }),
    );
    expect(mockPrisma.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: 'TREINADOR',
          ctId: 'ct-1',
          status: 'ACTIVE',
        }),
      }),
    );
    expect(mockPrisma.passwordResetRequest.create).toHaveBeenCalled();
  });

  it('gera senha provisória e mustChangePassword=true', async () => {
    await coachesMod.createCoach(
      'ct-1',
      'u-gestor-1',
      {
        name: 'Treinador Teste',
        cpf: '111.444.777-35',
        birthDate: '15/03/1985',
        email: 'treinador@teste.com',
      },
    );
    const userData = mockPrisma.user.create.mock.calls[0][0].data;
    expect(userData.tempPasswordExpiresAt).toBeTruthy();
    expect(userData.mustChangePassword).toBe(true);
  });

  it('rejeita CPF duplicado', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'u-existing', cpf: '11144477735' });
    const result = await coachesMod.createCoach(
      'ct-1',
      'u-gestor-1',
      {
        name: 'Treinador Teste',
        cpf: '111.444.777-35',
        birthDate: '15/03/1985',
        email: 'novo@teste.com',
      },
    );
    expect((result as any).error).toBe('CONFLICT');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('rejeita e-mail duplicado', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'u-existing', email: 'treinador@teste.com' });
    const result = await coachesMod.createCoach(
      'ct-1',
      'u-gestor-1',
      {
        name: 'Treinador Teste',
        cpf: '222.333.444-55',
        birthDate: '15/03/1985',
        email: 'treinador@teste.com',
      },
    );
    expect((result as any).error).toBe('CONFLICT');
  });
});

describe('createAthleteByGestor', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'u-athlete-1',
      name: 'Atleta Teste',
      email: 'atleta@teste.com',
      cpf: '22233344455',
    });
    mockPrisma.player.create.mockResolvedValue({
      id: 'p-1',
      name: 'Atleta Teste',
      userId: 'u-athlete-1',
    });
    mockPrisma.playerCT.create.mockResolvedValue({});
    mockPrisma.passwordResetRequest.create.mockResolvedValue({});
    mockPrisma.membership.findMany.mockResolvedValue([{ userId: 'u-coach-1' }]);

    jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }));
    athletesMod = await import('../athletes-logic');
  });

  it('cria atleta com sucesso', async () => {
    const result = await athletesMod.createAthleteByGestor({
      name: 'Atleta Teste',
      cpf: '222.333.444-55',
      birthDate: '10/06/2000',
      email: 'atleta@teste.com',
      gender: 'MASCULINO',
      laterality: 'DESTRO',
      ctId: 'ct-1',
      issuedByUserId: 'u-gestor-1',
    });
    expect((result as any).conflict).toBe(false);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: '22233344455',
          mustChangePassword: true,
          canOperate: true,
        }),
      }),
    );
    expect(mockPrisma.player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u-athlete-1',
          gender: 'MASCULINO',
          dominance: 'DESTRO',
        }),
      }),
    );
    expect(mockPrisma.playerCT.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ctId: 'ct-1',
          status: 'ACTIVE',
        }),
      }),
    );
    expect(mockPrisma.coachAthleteLink.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            playerId: 'p-1',
            status: 'ACTIVE',
          }),
        ]),
      }),
    );
  });

  it('detecta atleta já cadastrado (conflito de CPF)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-existing', cpf: '22233344455' });
    const result = await athletesMod.createAthleteByGestor({
      name: 'Atleta Teste',
      cpf: '222.333.444-55',
      birthDate: '10/06/2000',
      email: 'atleta@teste.com',
      gender: 'MASCULINO',
      laterality: 'DESTRO',
      ctId: 'ct-1',
    });
    expect((result as any).conflict).toBe(true);
    expect((result as any).inviteKind).toBe('ATLETA');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});
