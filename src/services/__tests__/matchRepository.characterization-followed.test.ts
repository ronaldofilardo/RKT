jest.mock('@/lib/prisma', () => mockPrismaModule());

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getPrismaMock, mockPrismaModule } from './matchRepositoryCharacterizationTestKit';

const mockPrisma = getPrismaMock();

describe('listMatches Context Segregation (pós-Fase 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não vaza anotações alheias para followedPlayerIds, trazendo apenas cartazes do círculo pendentes de anotação', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'PARTICULAR', ['player-followed-1']);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { createdByUserId: 'coach-1', ctId: null, isPublicTemplate: false, isTemplate: false },
            { createdByUserId: 'coach-1', ctId: null, isTemplate: true },
            {
              isTemplate: true,
              createdByUserId: { not: 'coach-1' },
              eventScope: { in: ['PUBLIC', 'PRIVATE_CLUB', 'PRIVATE_COACH', 'PRIVATE_PLAYERS'] },
              annotations: { none: { createdByUserId: 'coach-1', deletedAt: null, state: { not: 'CANCELLED' } } },
              OR: [
                { player1Id: { in: ['player-followed-1'] } },
                { player2Id: { in: ['player-followed-1'] } },
                { player1PartnerId: { in: ['player-followed-1'] } },
                { player2PartnerId: { in: ['player-followed-1'] } },
              ],
            },
          ],
        },
      }),
    );
  });
});
