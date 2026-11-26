import { checkMatchCreationQuota } from '../match-billing-quota.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    match: { count: jest.fn() },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('checkMatchCreationQuota', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite criação para usuário ADMIN', async () => {
    const res = await checkMatchCreationQuota('u-admin', { id: 'u-admin', role: 'ADMIN' } as any);
    expect(res.allowed).toBe(true);
  });

  it('permite criação se atleta independente tiver menos de 3 partidas', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      createdAt: new Date(),
      memberships: [],
    });
    (mockPrisma.match.count as jest.Mock).mockResolvedValueOnce(2);

    const res = await checkMatchCreationQuota('u1', { id: 'u1', role: 'ANNOTATOR' } as any);
    expect(res.allowed).toBe(true);
  });

  it('bloqueia criação se atleta independente atingir 3 partidas', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      createdAt: new Date(),
      memberships: [],
    });
    (mockPrisma.match.count as jest.Mock).mockResolvedValueOnce(3);

    const res = await checkMatchCreationQuota('u1', { id: 'u1', role: 'ANNOTATOR' } as any);
    expect(res.allowed).toBe(false);
    expect(res.message).toContain('Modo consulta ativo');
  });

  it('permite criação se usuário estiver vinculado a CT ativo', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      createdAt: new Date(),
      memberships: [{ kind: 'TREINADOR', ctId: 'ct-1', status: 'ACTIVE' }],
    });
    (mockPrisma.match.count as jest.Mock).mockResolvedValueOnce(10);

    const res = await checkMatchCreationQuota('u1', { id: 'u1', role: 'ANNOTATOR' } as any);
    expect(res.allowed).toBe(true);
  });
});
