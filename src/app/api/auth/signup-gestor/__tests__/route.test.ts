import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  trainingCenter: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  membership: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(async (fn: any) => fn(mockPrisma)),
};

let mod: any;

describe('createGestorClub', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockPrisma.trainingCenter.findUnique.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.trainingCenter.create.mockResolvedValue({
      id: 'ct-1',
      name: 'CT Teste',
      slug: 'ct-teste',
      status: 'PENDING',
    });
    mockPrisma.user.create.mockResolvedValue({
      id: 'u-1',
      name: 'João Silva',
      email: 'joao@teste.com',
    });
    mockPrisma.membership.create.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});

    jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }));
    mod = await import('../../signup-gestor-service');
  });

  const baseInput = {
    cnpj: '11.222.333/0001-81',
    razaoSocial: 'Clube Teste Ltda',
    nomeFantasia: 'CT Teste',
    telefone: '11999999999',
    email: 'clube@teste.com',
    endereco: {
      rua: 'Rua Teste',
      numero: '123',
      complemento: '',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
    },
    legalRepName: 'João Silva',
    legalRepCpf: '111.444.777-35',
    legalRepEmail: 'joao@teste.com',
    legalRepPhone: '11888888888',
    sameAsLegalRep: true,
    responsibleName: 'João Silva',
    responsibleCpf: '111.444.777-35',
    responsibleEmail: 'joao@teste.com',
    password: 'Senha@1234',
  };

  it('cria clube com sucesso', async () => {
    const result = await mod.createGestorClub(baseInput);
    expect((result as any).ok).toBe(true);
    expect(mockPrisma.trainingCenter.create).toHaveBeenCalled();
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.membership.create).toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('rejeita CNPJ duplicado', async () => {
    mockPrisma.trainingCenter.findUnique.mockResolvedValue({ id: 'ct-existing' });
    const result = await mod.createGestorClub(baseInput);
    expect((result as any).error).toBe('CONFLICT');
    expect((result as any).message).toBe('CNPJ já cadastrado');
    expect(mockPrisma.trainingCenter.create).not.toHaveBeenCalled();
  });

  it('rejeita CPF do responsável duplicado', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'u-existing', cpf: '11144477735' });
    const result = await mod.createGestorClub(baseInput);
    expect((result as any).error).toBe('CONFLICT');
    expect((result as any).message).toBe('CPF já cadastrado no sistema');
  });

  it('rejeita e-mail duplicado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-existing', email: 'joao@teste.com' });
    const result = await mod.createGestorClub(baseInput);
    expect((result as any).error).toBe('CONFLICT');
    expect((result as any).message).toBe('E-mail já cadastrado no sistema');
  });

  it('cria TrainingCenter com status PENDING', async () => {
    await mod.createGestorClub(baseInput);
    expect(mockPrisma.trainingCenter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
        }),
      }),
    );
  });
});
