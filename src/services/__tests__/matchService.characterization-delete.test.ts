jest.mock('@/lib/prisma', () => mockPrismaModule());

import { deleteRow, matchRow, mockPrismaModule, PLAYER_1 } from './matchServiceCharacterizationTestKit';
import { prisma } from '@/lib/prisma';
import { deleteMatch } from '../matchService';

const mockPrisma = prisma as any;

describe('matchService (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteMatch', () => {
    it('deve fazer soft delete de partida SCHEDULED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(deleteRow());
      mockPrisma.match.update.mockResolvedValue(
        matchRow({
          state: 'CANCELLED',
          deletedBy: PLAYER_1.id,
          deletedAt: new Date(),
          finishNote: 'Cancelada por chuva',
        }),
      );

      const result = await deleteMatch('match-1', {
        type: 'soft',
        reason: 'Cancelada por chuva',
        deletedBy: PLAYER_1.id,
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe('soft');
      expect(mockPrisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'CANCELLED',
            deletedAt: expect.any(Date),
            deletedBy: PLAYER_1.id,
            finishNote: 'Cancelada por chuva',
          }),
        }),
      );
    });

    it('deve fazer hard delete de partida sem pontos', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(deleteRow());
      mockPrisma.match.delete.mockResolvedValue({ id: 'match-1' });

      const result = await deleteMatch('match-1', { type: 'hard' });

      expect(result.success).toBe(true);
      expect(result.type).toBe('hard');
      expect(mockPrisma.match.delete).toHaveBeenCalledWith({ where: { id: 'match-1' } });
    });

    it('deve retornar erro ao tentar deletar partida FINISHED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(deleteRow({ state: 'FINISHED' }));

      const result: any = await deleteMatch('match-1', { type: 'hard' });

      expect(result.error).toContain('CANNOT_DELETE_FINISHED');
    });

    it('deve retornar MATCH_NOT_FOUND quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result: any = await deleteMatch('non-existent-id', { type: 'soft' });
      expect(result.error).toBe('MATCH_NOT_FOUND');
    });
  });
});
