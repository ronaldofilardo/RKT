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
    it('deve atualizar múltiplos campos de uma vez', async () => {
      mockPrisma.match.update.mockResolvedValue(
        matchRow({ nickname: 'Novo Nickname', visibility: 'PRIVATE', openForAnnotation: true }),
      );
      const result = await updateMatch('match-1', {
        nickname: 'Novo Nickname',
        visibility: 'PRIVATE',
        openForAnnotation: true,
      });
      expect(result?.nickname).toBe('Novo Nickname');
      expect(result?.visibility).toBe('PRIVATE');
      expect(result?.openForAnnotation).toBe(true);
    });

    it('deve retornar null quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result = await updateMatch('non-existent-id', { nickname: 'Test' });
      expect(result).toBeNull();
    });

    it('FIXED: TD-034 — updateMatch ignora campos não-whitelist silenciosamente', async () => {
      mockPrisma.match.update.mockResolvedValue(baseCreatedMatch);
      const result = await updateMatch('match-1', {
        unknownField: 'valor',
        anotherField: 123,
        nickname: 'valid-nickname',
      });

      const updateCall = mockPrisma.match.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('unknownField');
      expect(updateCall.data).not.toHaveProperty('anotherField');
      expect(updateCall.data).toHaveProperty('nickname', 'valid-nickname');
      expect(result).toBeDefined();
    });
  });
});
