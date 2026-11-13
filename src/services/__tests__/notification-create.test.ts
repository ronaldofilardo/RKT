import { describe, it, expect, beforeEach } from '@jest/globals';
import { notifyPoolMatchCreated, notifyCoachAssigned } from '../notification-create.logic';

describe('notification-create.logic', () => {
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      coachAthleteLink: { findMany: jest.fn().mockResolvedValue([]) },
      guardianLink: { findMany: jest.fn().mockResolvedValue([]) },
      player: { findMany: jest.fn().mockResolvedValue([]) },
      playerCT: { findMany: jest.fn().mockResolvedValue([]) },
      membership: { findMany: jest.fn().mockResolvedValue([]) },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ name: 'Creator User' }),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    };
  });

  it('cria POOL_MATCH_WITH_MY_ATHLETE para treinador do atleta e POOL_MATCH_AVAILABLE para outros', async () => {
    mockTx.coachAthleteLink.findMany.mockResolvedValue([{ coachUserId: 'coach-1' }]);
    mockTx.user.findMany.mockResolvedValue([{ id: 'user-2' }, { id: 'creator-1' }]);

    const template = {
      id: 'template-1',
      player1Id: 'p1',
      player2Id: 'p2',
      player1: { name: 'Rafael Nadal' },
      player2: { name: 'Roger Federer' },
      tournamentName: 'Roland Garros',
      scheduledAt: new Date('2026-06-01T14:00:00Z'),
    };

    await notifyPoolMatchCreated(template, 'creator-1', mockTx);

    expect(mockTx.notification.createMany).toHaveBeenCalledTimes(1);
    const callArg = mockTx.notification.createMany.mock.calls[0][0];
    expect(callArg.data).toHaveLength(2);

    const withAthlete = callArg.data.find((n: any) => n.recipientId === 'coach-1');
    expect(withAthlete).toBeDefined();
    expect(withAthlete.type).toBe('POOL_MATCH_WITH_MY_ATHLETE');
    expect(withAthlete.payload.player1Name).toBe('Rafael Nadal');

    const available = callArg.data.find((n: any) => n.recipientId === 'user-2');
    expect(available).toBeDefined();
    expect(available.type).toBe('POOL_MATCH_AVAILABLE');

    // Criador não deve receber notificação
    expect(callArg.data.find((n: any) => n.recipientId === 'creator-1')).toBeUndefined();
  });

  it('notifyCoachAssigned cria notificação do tipo ASSIGNED_TO_ANNOTATE', async () => {
    const template = {
      id: 'template-2',
      player1: { name: 'Carlos Alcaraz' },
      player2: { name: 'Jannik Sinner' },
      scheduledAt: new Date('2026-07-01T10:00:00Z'),
    };

    await notifyCoachAssigned(template, 'coach-assigned', 'Gestor João', mockTx);

    expect(mockTx.notification.create).toHaveBeenCalledWith({
      data: {
        recipientId: 'coach-assigned',
        type: 'ASSIGNED_TO_ANNOTATE',
        payload: {
          matchId: 'template-2',
          templateId: 'template-2',
          player1Name: 'Carlos Alcaraz',
          player2Name: 'Jannik Sinner',
          assignedByName: 'Gestor João',
          scheduledAt: '2026-07-01T10:00:00.000Z',
        },
      },
    });
  });
});

