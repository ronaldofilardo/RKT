jest.mock('@/lib/prisma', () => mockPrismaModule());

import { baseCreatedMatch, matchRow, mockPrismaModule } from './matchServiceCharacterizationTestKit';
import { prisma } from '@/lib/prisma';
import { updateMatch } from '../matchService';

const mockPrisma = prisma as any;

describe('matchService (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
  });

  describe('updateMatch', () => {
    it('deve atualizar nickname', async () => {
      mockPrisma.match.update.mockResolvedValue(matchRow({ nickname: 'Atualizado' }));
      const result = await updateMatch('match-1', { nickname: 'Atualizado' });
      expect(result).toBeDefined();
      expect(result?.nickname).toBe('Atualizado');
    });

    it('deve atualizar sportType', async () => {
      mockPrisma.match.update.mockResolvedValue(matchRow({ sportType: 'PADEL' }));
      const result = await updateMatch('match-1', { sportType: 'PADEL' });
      expect(result).toBeDefined();
      expect(result?.sportType).toBe('PADEL');
    });

    it('deve atualizar courtType para null', async () => {
      mockPrisma.match.update.mockResolvedValue(matchRow({ courtType: null }));
      const result = await updateMatch('match-1', { courtType: null });
      expect(result).toBeDefined();
      expect(result?.courtType).toBeNull();
    });

    it('deve atualizar visibility', async () => {
      mockPrisma.match.update.mockResolvedValue(matchRow({ visibility: 'PRIVATE' }));
      const result = await updateMatch('match-1', { visibility: 'PRIVATE' });
      expect(result).toBeDefined();
      expect(result?.visibility).toBe('PRIVATE');
    });

    it('deve atualizar openForAnnotation', async () => {
      mockPrisma.match.update.mockResolvedValue(matchRow({ openForAnnotation: true }));
      const result = await updateMatch('match-1', { openForAnnotation: true });
      expect(result).toBeDefined();
      expect(result?.openForAnnotation).toBe(true);
    });

    it('deve atualizar scheduledAt', async () => {
      const newDate = new Date('2026-09-01T14:00:00Z');
      mockPrisma.match.update.mockResolvedValue(matchRow({ scheduledAt: newDate }));
      const result = await updateMatch('match-1', { scheduledAt: newDate.toISOString() });
      expect(result).toBeDefined();
      expect(result?.scheduledAt).toEqual(newDate);
    });
  });
});
