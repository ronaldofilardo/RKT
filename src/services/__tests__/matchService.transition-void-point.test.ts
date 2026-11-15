jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { matchRow, scoreState, set, game } from './matchServiceTestKit';

const mockPrisma = prisma as any;

describe('matchService.transitionMatchState - voidPointLogId atomic undo', () => {
  it('deve anular o pointLog atomicamente dentro da transacao junto com a atualizacao do scoreState', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({ version: 5, scoreState: scoreState({ sets: [set(1, 0)], currentGame: game(1, 0) }) }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1', version: 6 });

    const undoneState = scoreState({ sets: [set(0, 0)] });

    const result = await transitionMatchState(
      'm1', 'IN_PROGRESS', undefined, undoneState,
      { allowScoreEdit: true, expectedVersion: 5, voidPointLogId: 'point-123' },
    );

    expect(result).toEqual({ id: 'm1', version: 6 });
    expect(mockPrisma.pointLog.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'point-123', matchId: 'm1', voidedAt: null },
        data: expect.objectContaining({ voidedAt: expect.any(Date) }),
      }),
    );
  });

  it('deve retornar VERSION_CONFLICT se a versao esperada conflitar (transacao sofre rollback)', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(matchRow({ version: 6, scoreState: null }));
    const p2025Error: any = new Error('Record to update not found.');
    p2025Error.code = 'P2025';
    mockPrisma.match.update.mockRejectedValue(p2025Error);

    const result = await transitionMatchState(
      'm1', 'IN_PROGRESS', undefined, null,
      { allowScoreEdit: true, expectedVersion: 5, voidPointLogId: 'point-123' },
    );

    expect(result).toEqual({ error: 'VERSION_CONFLICT' });
  });

  it('deve anular o ultimo pointLog quando voidLastPoint ou isUndo=true for informado sem voidPointLogId', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(matchRow({ version: 5, scoreState: null }));
    mockPrisma.pointLog.findFirst.mockResolvedValue({ id: 'point-last-999', matchId: 'm1', sequenceNumber: 10 });
    mockPrisma.pointLog.update.mockResolvedValue({ id: 'point-last-999', voidedAt: new Date(), sequenceNumber: null });
    mockPrisma.match.update.mockResolvedValue({ id: 'm1', version: 6 });

    const result = await transitionMatchState(
      'm1', 'IN_PROGRESS', undefined, null,
      { allowScoreEdit: true, expectedVersion: 5, isUndo: true },
    );

    expect(result).toEqual({ id: 'm1', version: 6 });
    expect(mockPrisma.pointLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { matchId: 'm1', voidedAt: null },
        orderBy: { sequenceNumber: 'desc' },
      }),
    );
    expect(mockPrisma.pointLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'point-last-999' },
        data: expect.objectContaining({ sequenceNumber: null }),
      }),
    );
  });
});
