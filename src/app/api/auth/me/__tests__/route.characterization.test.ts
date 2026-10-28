import { NextRequest } from 'next/server';
import { GET } from '../route';

/**
 * Characterization-first (RULES §7): fixa o contrato ATUAL de GET /api/auth/me
 * antes de qualquer extensão. A extensão da Fase 1 é aditiva: estes testes
 * devem continuar verdes sem edição.
 */
jest.mock('@/lib/auth', () => ({
  getUserFromRequestScoped: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    trainingCenter: { findUnique: jest.fn() },
  },
}));

const { getUserFromRequestScoped } = jest.requireMock('@/lib/auth');
const { prisma } = jest.requireMock('@/lib/prisma');

const baseUser = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@rkt.com',
  role: 'ANNOTATOR',
  cpf: '12345678909',
  mustChangePassword: false,
};

/** Sessão definida em cada chamada: `restoreMocks` do Jest zera implementações entre testes. */
async function callMe(session: unknown = { id: 'u1', role: 'ANNOTATOR' }) {
  getUserFromRequestScoped.mockResolvedValueOnce(session);
  return GET(new NextRequest('http://localhost:3000/api/auth/me'));
}

describe('GET /api/auth/me — characterization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('401 sem sessão, com corpo { error, message }', async () => {
    const res = await callMe(null);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: 'UNAUTHORIZED',
      message: 'Token de acesso requerido',
    });
  });

  it('404 quando a conta não existe mais', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const res = await callMe();
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('NOT_FOUND');
  });

  it('consulta apenas vínculos ATIVOS do usuário autenticado', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ ...baseUser, memberships: [] });
    await callMe();
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        select: expect.objectContaining({
          memberships: expect.objectContaining({ where: { status: 'ACTIVE' } }),
        }),
      }),
    );
  });

  it('expõe exatamente os campos públicos de user (sem hash/segredos)', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...baseUser,
      passwordHash: 'segredo',
      memberships: [],
    });
    const data = await (await callMe()).json();
    expect(data.user).toEqual(baseUser);
    expect(JSON.stringify(data)).not.toContain('segredo');
  });

  it('memberships saem só com kind, ctId e status; ctId ausente vira null', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...baseUser,
      memberships: [
        { kind: 'TREINADOR', ctId: undefined, status: 'ACTIVE', preset: null, extra: 1 },
      ],
    });
    const data = await (await callMe()).json();
    expect(data.memberships).toEqual([{ kind: 'TREINADOR', ctId: null, status: 'ACTIVE' }]);
  });

  it('sem campo memberships na linha → lista vazia e ctStatus null', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ ...baseUser });
    const data = await (await callMe()).json();
    expect(data.memberships).toEqual([]);
    expect(data.ctStatus).toBeNull();
  });

  it('sem vínculo GESTOR não consulta o CT e ctStatus é null', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...baseUser,
      memberships: [{ kind: 'TREINADOR', ctId: 'ct-1', status: 'ACTIVE' }],
    });
    const data = await (await callMe()).json();
    expect(prisma.trainingCenter.findUnique).not.toHaveBeenCalled();
    expect(data.ctStatus).toBeNull();
  });

  it('GESTOR sem ctId não gera ctStatus', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...baseUser,
      memberships: [{ kind: 'GESTOR', ctId: null, status: 'ACTIVE' }],
    });
    const data = await (await callMe()).json();
    expect(prisma.trainingCenter.findUnique).not.toHaveBeenCalled();
    expect(data.ctStatus).toBeNull();
  });

  it.each(['PENDING', 'ACTIVE', 'SUSPENDED'])(
    'GESTOR com CT %s → ctStatus reflete o status do CT',
    async (status) => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...baseUser,
        memberships: [{ kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' }],
      });
      prisma.trainingCenter.findUnique.mockResolvedValueOnce({ status });
      const data = await (await callMe()).json();
      expect(prisma.trainingCenter.findUnique).toHaveBeenCalledWith({
        where: { id: 'ct-1' },
        select: { status: true },
      });
      expect(data.ctStatus).toBe(status);
    },
  );

  it('GESTOR com CT inexistente → ctStatus null', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...baseUser,
      memberships: [{ kind: 'GESTOR', ctId: 'ct-x', status: 'ACTIVE' }],
    });
    prisma.trainingCenter.findUnique.mockResolvedValueOnce(null);
    const data = await (await callMe()).json();
    expect(data.ctStatus).toBeNull();
  });

  it('propaga mustChangePassword', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...baseUser,
      mustChangePassword: true,
      memberships: [],
    });
    const data = await (await callMe()).json();
    expect(data.user.mustChangePassword).toBe(true);
  });
});
