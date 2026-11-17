jest.mock('@/lib/prisma', () => mockPrismaModule());

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getPrismaMock, mockPrismaModule } from './matchRepositoryCharacterizationTestKit';

const mockPrisma = getPrismaMock();

describe('listMatches Context Segregation (pós-Fase 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cartaz de outro criador NUNCA entra no escopo do anotador', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'ct-rkt-123');

    const where = mockPrisma.match.findMany.mock.calls[0][0].where;
    const templateConds = (where.OR as Array<Record<string, unknown>>).filter((c) => c.isTemplate === true);
    expect(templateConds).toHaveLength(1);
    expect(templateConds[0].createdByUserId).toBe('coach-1');
  });
});
