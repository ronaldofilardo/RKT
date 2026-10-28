import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  trainingCenter: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  membership: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  auditLog: {
    create: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock do access-handler para bypassar autenticação nos testes
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (
    _request: any,
    _action: string,
    _resolveResource: any,
    handler: any,
  ) => handler({ user: { id: 'u-admin', role: 'ADMIN' } as any, actor: { id: 'u-admin', role: 'ADMIN', isActive: true, canOperate: true, memberships: [], athleteProfile: null, guardianLinks: [], coachAthleteLinks: [] } as any }),
}));

describe('PATCH /api/training-centers/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.trainingCenter.findUnique.mockResolvedValue({
      id: 'ct-1',
      name: 'CT Teste',
      status: 'PENDING',
    });
    mockPrisma.trainingCenter.update.mockImplementation(async ({ data }: any) => ({
      id: 'ct-1',
      name: 'CT Teste',
      status: data.status,
    }));
    mockPrisma.auditLog.create.mockResolvedValue({});
  });

  it('aprova CT alterando status para ACTIVE', async () => {
    const { PATCH } = await import('../route');

    const req = new Request('http://localhost:3000/api/training-centers/ct-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
      headers: { 'Content-Type': 'application/json' },
    }) as any;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'ct-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('ACTIVE');
    expect(mockPrisma.trainingCenter.update).toHaveBeenCalledWith({
      where: { id: 'ct-1' },
      data: { status: 'ACTIVE' },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CLUBE_APROVADO',
        }),
      }),
    );
  });

  it('suspende CT alterando status para SUSPENDED', async () => {
    const { PATCH } = await import('../route');

    const req = new Request('http://localhost:3000/api/training-centers/ct-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SUSPENDED' }),
      headers: { 'Content-Type': 'application/json' },
    }) as any;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'ct-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('SUSPENDED');
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CLUBE_SUSPENSO',
        }),
      }),
    );
  });

  it('rejeita status inválido', async () => {
    const { PATCH } = await import('../route');

    const req = new Request('http://localhost:3000/api/training-centers/ct-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'INVALIDO' }),
      headers: { 'Content-Type': 'application/json' },
    }) as any;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'ct-1' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
  });
});
