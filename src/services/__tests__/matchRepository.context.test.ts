import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  match: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('listMatches Context Segregation (isolamento estrito)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve filtrar por ctId null e createdByUserId no modo PARTICULAR', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'PARTICULAR');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', ctId: null, isPublicTemplate: false, isTemplate: false },
            { createdByUserId: 'coach-1', ctId: null, isTemplate: true },
          ],
        },
      }),
    );
  });

  it('deve filtrar por ctId do clube E createdByUserId no modo CT (isolamento entre treinadores)', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'ct-rkt-123');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', ctId: 'ct-rkt-123', isPublicTemplate: false, isTemplate: false },
            { createdByUserId: 'coach-1', ctId: 'ct-rkt-123', isTemplate: true },
          ],
        },
      }),
    );
  });

  it('NÃO vaza anotações de outros anotadores mesmo quando atletas seguidos participam', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'PARTICULAR', ['player-followed-1']);

    const where = mockPrisma.match.findMany.mock.calls[0][0].where;
    expect(where.deletedAt).toBe(null);
    expect(where.ctId).toBeUndefined();
    // Condições não-template (anotações reais) continuam estritamente restritas ao próprio criador.
    const nonTemplates = (where.OR as Array<Record<string, unknown>>).filter((c) => c.isTemplate === false);
    for (const cond of nonTemplates) {
      expect(cond.createdByUserId).toBe('coach-1');
    }
    // Cartaz alheio de atleta seguido só entra se for template com anotações zeradas do usuário
    const templates = (where.OR as Array<Record<string, unknown>>).filter((c) => c.isTemplate === true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it('mantém comportamento legado sem contextId filtrando apenas por createdByUserId', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', null);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', isPublicTemplate: false, isTemplate: false },
            { createdByUserId: 'coach-1', isTemplate: true },
          ],
        },
      }),
    );
  });
});
