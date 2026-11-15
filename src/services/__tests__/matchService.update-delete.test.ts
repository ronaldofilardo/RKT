jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as any;

describe('matchService.updateMatch', () => {
  it('deve atualizar partida existente', async () => {
    const { updateMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({ id: 'm1' });
    mockPrisma.match.update.mockResolvedValue({ id: 'm1', nickname: 'New Name' });

    const result = await updateMatch('m1', { nickname: 'New Name' });

    expect(result).toBeTruthy();
    expect(mockPrisma.match.update).toHaveBeenCalled();
  });

  it('deve retornar null se partida não existe', async () => {
    const { updateMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(null);

    const result = await updateMatch('nonexistent', { nickname: 'X' });

    expect(result).toBeNull();
    expect(mockPrisma.match.update).not.toHaveBeenCalled();
  });
});

describe('matchService.deleteMatch', () => {
  it('deve deletar partida existente e retornar sucesso', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      pointLog: [],
      annotationSessions: [],
      state: 'SCHEDULED',
    });
    mockPrisma.match.delete.mockResolvedValue({ id: 'm1' });

    const result = await deleteMatch('m1', { type: 'hard' });

    expect(result).toEqual({
      success: true,
      type: 'hard',
      stats: { points: 0, annotationSessions: 0 },
    });
  });

  it('deve retornar erro MATCH_NOT_FOUND se partida não existe', async () => {
    const { deleteMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(null);

    const result = await deleteMatch('nonexistent', { type: 'hard' });

    expect(result).toEqual({ error: 'MATCH_NOT_FOUND' });
  });
});
