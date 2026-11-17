jest.mock('@/lib/prisma', () => mockPrismaModule());

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getPrismaMock, mockPrismaModule } from './matchRepositoryCharacterizationTestKit';

const mockPrisma = getPrismaMock();

describe('listMatches Context Segregation (pós-Fase 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gestor com ctMemberUserIds inclui derivadas dos membros do clube', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'gestor-1', null, null, {
      unrestricted: false,
      ctMemberUserIds: ['membro-a', 'membro-b'],
    });

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'gestor-1', isPublicTemplate: false, isTemplate: false },
            {
              sourceMatchId: { not: null },
              createdByUserId: { in: ['membro-a', 'membro-b'] },
              isPublicTemplate: false,
              isTemplate: false,
            },
            { isTemplate: true, createdByUserId: 'gestor-1' },
          ],
        },
      }),
    );
  });

  it('assignedCoachId inclui cartazes designados ainda sem anotação própria', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', null, null, null, 'coach-1');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', isPublicTemplate: false, isTemplate: false },
            { isTemplate: true, createdByUserId: 'coach-1' },
            {
              assignedCoachId: 'coach-1',
              annotations: { none: { createdByUserId: 'coach-1', deletedAt: null, state: { not: 'CANCELLED' } } },
            },
          ],
        },
      }),
    );
  });
});
