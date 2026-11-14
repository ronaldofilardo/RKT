import { filterActiveExistingScheduledNotifs, findUserFinishedDerivedMatchIds } from '../scheduled-active-filter.logic';
import { prisma } from '@/lib/prisma';
import type { Notification } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany: jest.fn(),
    },
    notification: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

describe('scheduled-active-filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mantém notificações de partidas em andamento e descarta finalizadas', async () => {
    const notifs = [
      { id: 'n1', payload: { matchId: 'm1' } },
      { id: 'n2', payload: { matchId: 'm2' } },
    ] as unknown as Notification[];

    (prisma.match.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'm1', state: 'IN_PROGRESS' },
        { id: 'm2', state: 'FINISHED' },
      ])
      .mockResolvedValueOnce([]);

    const result = await filterActiveExistingScheduledNotifs(notifs, 'coach-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['n2'] } } }),
    );
  });

  it('findUserFinishedDerivedMatchIds retorna IDs das partidas já encerradas pelo usuário', async () => {
    (prisma.match.findMany as jest.Mock).mockResolvedValueOnce([
      { sourceMatchId: 'm1' },
      { sourceMatchId: 'm3' },
    ]);

    const result = await findUserFinishedDerivedMatchIds(['m1', 'm2', 'm3'], 'coach-1');
    expect(result.has('m1')).toBe(true);
    expect(result.has('m2')).toBe(false);
    expect(result.has('m3')).toBe(true);
  });
});
