import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { loadGestorExternalScheduledMatches } from '../gestor-external-matches.logic';

describe('loadGestorExternalScheduledMatches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna vazio se o clube não tiver atletas vinculados', async () => {
    const spy = jest.spyOn(prisma.match, 'findMany').mockResolvedValue([]);
    const res = await loadGestorExternalScheduledMatches('club-a', ['coach-1'], []);
    expect(res).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('busca partidas agendadas de fora envolvendo atletas do clube', async () => {
    const mockRows: any = [
      {
        id: 'external-match-1',
        format: 'BEST_OF_3',
        state: 'PENDING',
        createdAt: new Date('2026-11-12T10:00:00Z'),
        scheduledAt: new Date('2026-11-15T15:00:00Z'),
        player1: { id: 'athlete-x', name: 'Atleta X', club: 'Clube A' },
        player2: { id: 'athlete-y', name: 'Atleta Y', club: 'Particular' },
        createdByUser: { id: 'coach-b', name: 'Treinador B', email: 'b@test.com' },
      },
    ];
    const spy = jest.spyOn(prisma.match, 'findMany').mockResolvedValue(mockRows);

    const res = await loadGestorExternalScheduledMatches(
      'club-a',
      ['coach-1', 'gestor-1'],
      ['athlete-x'],
    );

    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('external-match-1');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          sourceMatchId: null,
          OR: [{ player1Id: { in: ['athlete-x'] } }, { player2Id: { in: ['athlete-x'] } }],
          AND: expect.arrayContaining([
            { OR: [{ ctId: null }, { ctId: { not: 'club-a' } }] },
            { createdByUserId: { notIn: ['coach-1', 'gestor-1'] } },
          ]),
        }),
      }),
    );
  });
});
