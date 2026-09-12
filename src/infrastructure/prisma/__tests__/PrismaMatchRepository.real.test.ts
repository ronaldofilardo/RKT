jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    matchAnnotationSession: {
      findFirst: jest.fn(),
    },
  },
}));

import { PrismaMatchRepository } from '../PrismaMatchRepository';
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PrismaMatchRepository - Regressoes Reais', () => {
  let repository: PrismaMatchRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaMatchRepository();
  });

  it('deve listar partidas com parametros de paginacao padrao', async () => {
    const mockMatches = [{ id: 'match-1', state: 'IN_PROGRESS' }];
    (mockPrisma.match.findMany as jest.Mock).mockResolvedValue(mockMatches);

    const result = await repository.list({ limit: 10 });

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    );
    expect(result).toEqual(mockMatches);
  });

  it('deve buscar partida por id utilizando findFirst', async () => {
    const mockMatch = { id: 'match-xyz', state: 'SCHEDULED' };
    (mockPrisma.match.findFirst as jest.Mock).mockResolvedValue(mockMatch);

    const result = await repository.findById('match-xyz');

    expect(mockPrisma.match.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'match-xyz' },
      })
    );
    expect(result).toEqual(mockMatch);
  });
});
