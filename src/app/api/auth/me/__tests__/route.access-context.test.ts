import { NextRequest } from 'next/server';
import { GET } from '../route';

jest.mock('@/lib/auth', () => ({ getUserFromRequestScoped: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    trainingCenter: { findUnique: jest.fn() },
  },
}));

const { getUserFromRequestScoped } = jest.requireMock('@/lib/auth');
const { prisma } = jest.requireMock('@/lib/prisma');

const row = {
  id: 'u1',
  name: 'Bia',
  email: 'bia@rkt.com',
  role: 'ANNOTATOR',
  cpf: '12345678909',
  mustChangePassword: false,
};

/** Sessão definida em cada chamada: `restoreMocks` do Jest zera implementações entre testes. */
async function callMe() {
  getUserFromRequestScoped.mockResolvedValueOnce({ id: 'u1', role: 'ANNOTATOR' });
  return GET(new NextRequest('http://localhost:3000/api/auth/me'));
}

describe('GET /api/auth/me — contexto de acesso (Fase 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('solicita à consulta os campos usados pelo menu', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ ...row, memberships: [] });
    await callMe();
    const { select } = prisma.user.findUnique.mock.calls[0][0];
    expect(select.canOperate).toBe(true);
    expect(select.memberships.select.preset).toBe(true);
    expect(select.athleteProfile.select.playerCts.where).toEqual({ status: 'ACTIVE' });
  });

  it('conta acumulando gestor + treinador avulso + atleta de clube', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...row,
      canOperate: true,
      memberships: [
        { kind: 'GESTOR', preset: null, ctId: 'ct-1', status: 'ACTIVE' },
        { kind: 'TREINADOR', preset: null, ctId: null, status: 'ACTIVE' },
      ],
      athleteProfile: {
        id: 'p-1',
        birthDate: new Date('1990-01-01T00:00:00Z'),
        playerCts: [{ ctId: 'ct-1' }],
      },
    });
    prisma.trainingCenter.findUnique.mockResolvedValueOnce({ status: 'ACTIVE' });

    const data = await (await callMe()).json();

    expect(data.ctStatus).toBe('ACTIVE');
    expect(data.canOperate).toBe(true);
    expect(data.isAdmin).toBe(false);
    expect(data.isSuporte).toBe(false);
    expect(data.coach).toEqual({ ctIds: [] });
    expect(data.athlete).toEqual({ playerId: 'p-1', ctIds: ['ct-1'], isMinor: false });
    expect(data.memberships).toEqual([
      { kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' },
      { kind: 'TREINADOR', ctId: null, status: 'ACTIVE' },
    ]);
  });

  it('suporte: isSuporte true sem vazar o preset em memberships', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      ...row,
      memberships: [{ kind: 'PLATAFORMA', preset: 'SUPORTE', ctId: null, status: 'ACTIVE' }],
    });
    const data = await (await callMe()).json();
    expect(data.isSuporte).toBe(true);
    expect(data.memberships).toEqual([{ kind: 'PLATAFORMA', ctId: null, status: 'ACTIVE' }]);
  });
});
