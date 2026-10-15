import { NextRequest } from 'next/server';
import { GET } from '../route';

jest.mock('@/lib/auth', () => ({
  getUserFromRequestScoped: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const { getUserFromRequestScoped } = jest.requireMock('@/lib/auth');
const { prisma } = jest.requireMock('@/lib/prisma');

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se usuário não autenticado', async () => {
    getUserFromRequestScoped.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/auth/me');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retorna dados do usuário autenticado', async () => {
    getUserFromRequestScoped.mockResolvedValueOnce({ id: 'u1', role: 'ANNOTATOR' });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      name: 'Guilherme Igeski Stencel',
      email: 'guilherme.stencel@rkt.com',
      role: 'ANNOTATOR',
      cpf: '13996598980',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/me');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.name).toBe('Guilherme Igeski Stencel');
  });
});
