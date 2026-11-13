import { describe, it, expect, jest } from '@jest/globals';
import { resolveAthleteAssociatedUserIds } from '../notification-recipients.logic';
import { notifyPoolMatchCreated } from '../notification-create.logic';

describe('resolveAthleteAssociatedUserIds & notifyPoolMatchCreated', () => {
  it('identifica treinadores vinculados, guardiões, o próprio atleta e gestores dos clubes afiliados', async () => {
    const mockTx: any = {
      coachAthleteLink: {
        findMany: jest.fn<any>().mockResolvedValue([{ coachUserId: 'coach-b-id' }]),
      },
      guardianLink: {
        findMany: jest.fn<any>().mockResolvedValue([{ guardianUserId: 'guardian-id' }]),
      },
      player: {
        findMany: jest.fn<any>().mockResolvedValue([{ userId: 'athlete-x-id' }, { userId: 'athlete-y-id' }]),
      },
      playerCT: {
        findMany: jest.fn<any>().mockResolvedValue([{ ctId: 'club-a-id' }]),
      },
      membership: {
        findMany: jest.fn<any>().mockResolvedValue([{ userId: 'gestor-a-id' }]),
      },
      user: {
        findUnique: jest.fn<any>().mockResolvedValue({ name: 'Treinador B' }),
      },
      notification: {
        createMany: jest.fn<any>().mockResolvedValue({ count: 4 }),
      },
    };

    const recipients = await resolveAthleteAssociatedUserIds(
      ['player-x-id', 'player-y-id'],
      'coach-b-id', // Criador não deve receber a própria notificação
      mockTx,
    );

    expect(recipients).toContain('guardian-id');
    expect(recipients).toContain('athlete-x-id');
    expect(recipients).toContain('athlete-y-id');
    expect(recipients).toContain('gestor-a-id');
    expect(recipients).not.toContain('coach-b-id');

    await notifyPoolMatchCreated(
      {
        id: 'tpl-1',
        player1Id: 'player-x-id',
        player2Id: 'player-y-id',
        player1: { name: 'Atleta X' },
        player2: { name: 'Atleta Y' },
        scheduledAt: new Date('2026-11-20T10:00:00Z'),
      },
      'coach-b-id',
      mockTx,
      false, // isPublic = false (círculo)
    );

    expect(mockTx.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          recipientId: 'athlete-x-id',
          type: 'POOL_MATCH_WITH_MY_ATHLETE',
          payload: expect.objectContaining({
            player1Name: 'Atleta X',
            player2Name: 'Atleta Y',
            createdByName: 'Treinador B',
          }),
        }),
        expect.objectContaining({
          recipientId: 'gestor-a-id',
          type: 'POOL_MATCH_WITH_MY_ATHLETE',
        }),
      ]),
    });
  });
});

