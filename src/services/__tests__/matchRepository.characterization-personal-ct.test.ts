jest.mock('@/lib/prisma', () => mockPrismaModule());

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getPrismaMock, mockPrismaModule } from './matchRepositoryCharacterizationTestKit';

const mockPrisma = getPrismaMock();

describe('listMatches Context Segregation (pós-Fase 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna lista vazia sem chamar Prisma quando createdByUserId é omitido', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    const result = await listMatches(null, null, 20, null);
    expect(result).toEqual([]);
    expect(mockPrisma.match.findMany).not.toHaveBeenCalled();
  });

  it('filtra por ctId null e createdByUserId no modo PARTICULAR', async () => {
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

  it('filtra por ctId E createdByUserId no modo CT (sem vazamento entre treinadores)', async () => {
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
});
