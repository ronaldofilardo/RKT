jest.mock('@/lib/prisma', () => ({
  prisma: { match: { findMany: jest.fn() } },
}));

import { prisma } from '@/lib/prisma';
import { listPublicPool } from '../pool-list.logic';

const mockFindMany = prisma.match.findMany as jest.MockedFunction<any>;

describe('listPublicPool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filtra somente templates públicos não excluídos', async () => {
    mockFindMany.mockResolvedValue([]);

    await listPublicPool({ limit: 20 });

    const args = mockFindMany.mock.calls[0][0];
    expect(args.where).toEqual({ isPublicTemplate: true, deletedAt: null });
    expect(args.take).toBe(20);
    expect(args.orderBy).toEqual([
      { scheduledAt: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ]);
  });

  it('aplica cursor quando informado', async () => {
    mockFindMany.mockResolvedValue([]);

    await listPublicPool({ cursor: 'last-id', limit: 10 });

    const args = mockFindMany.mock.calls[0][0];
    expect(args.skip).toBe(1);
    expect(args.cursor).toEqual({ id: 'last-id' });
  });

  it('achata o _count de anotações em annotationCount', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'tpl-1',
        format: 'BEST_OF_3',
        player1: { id: 'p1', name: 'A', nickname: 'a' },
        player2: { id: 'p2', name: 'B', nickname: null },
        _count: { annotations: 3 },
      },
    ]);

    const [item] = await listPublicPool({ limit: 20 });

    expect(item).toMatchObject({ id: 'tpl-1', annotationCount: 3 });
    expect((item as Record<string, unknown>)._count).toBeUndefined();
  });
});
