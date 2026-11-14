import { filterActiveAssignedNotifications } from '../assigned-filter.logic';
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

describe('filterActiveAssignedNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mantém partidas em andamento ou agendadas', async () => {
    const notifs = [
      { id: 'n1', payload: { matchId: 'm1' } },
      { id: 'n2', payload: { matchId: 'm2' } },
    ] as unknown as Notification[];

    (prisma.match.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'm1', state: 'SCHEDULED' },
        { id: 'm2', state: 'IN_PROGRESS' },
      ])
      .mockResolvedValueOnce([]); // sem derivados finalizados

    const result = await filterActiveAssignedNotifications(notifs, 'user-coach-1');
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['n1', 'n2']);
  });

  it('remove partidas finalizadas (FINISHED) e canceladas (CANCELLED)', async () => {
    const notifs = [
      { id: 'n1', payload: { matchId: 'm1' } },
      { id: 'n2', payload: { matchId: 'm2' } },
    ] as unknown as Notification[];

    (prisma.match.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'm1', state: 'FINISHED' },
        { id: 'm2', state: 'IN_PROGRESS' },
      ])
      .mockResolvedValueOnce([]);

    const result = await filterActiveAssignedNotifications(notifs, 'user-coach-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n2');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['n1'] } } }),
    );
  });

  it('remove partida se o treinador já finalizou sua anotação derivada', async () => {
    const notifs = [
      { id: 'n1', payload: { matchId: 'm1' } },
    ] as unknown as Notification[];

    (prisma.match.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'm1', state: 'IN_PROGRESS' },
      ])
      .mockResolvedValueOnce([
        { sourceMatchId: 'm1' },
      ]);

    const result = await filterActiveAssignedNotifications(notifs, 'user-coach-1');
    expect(result).toHaveLength(0);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['n1'] } } }),
    );
  });
});
