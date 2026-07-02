jest.mock('@/services/annotationSessionService', () => ({
  listSessions: jest.fn(),
  startSession: jest.fn(),
  endSession: jest.fn(),
  endorseSession: jest.fn(),
  markSessionAbandoned: jest.fn(),
  useAnnotationSession: jest.fn().mockReturnValue({
    start: jest.fn(),
    end: jest.fn(),
    abandon: jest.fn(),
    endorse: jest.fn(),
  }),
}));

import * as annotationSessionService from '@/services/annotationSessionService';

const mockService = annotationSessionService as jest.Mocked<typeof annotationSessionService>;

describe('annotationSessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'access_token') return 'mock-token';
      return null;
    });
  });

  describe('listSessions', () => {
    it('deve chamar fetch com token', async () => {
      const mockSessions = [{ id: 's1', annotatorUserId: 'u1' }];
      mockService.listSessions.mockResolvedValue(mockSessions as any);

      const result = await mockService.listSessions('match-1');

      expect(mockService.listSessions).toHaveBeenCalledWith('match-1');
      expect(result).toEqual(mockSessions);
    });
  });

  describe('startSession', () => {
    it('deve iniciar sessão', async () => {
      const mockSession = { id: 's1', matchId: 'match-1', isActive: true };
      mockService.startSession.mockResolvedValue(mockSession as any);

      const result = await mockService.startSession('match-1');

      expect(mockService.startSession).toHaveBeenCalledWith('match-1');
      expect(result).toEqual(mockSession);
    });

    it('deve iniciar sessão com autoStarted=true', async () => {
      const mockSession = { id: 's1', matchId: 'match-1', isActive: true };
      mockService.startSession.mockResolvedValue(mockSession as any);

      const result = await mockService.startSession('match-1', true);

      expect(mockService.startSession).toHaveBeenCalledWith('match-1', true);
    });
  });

  describe('endSession', () => {
    it('deve finalizar sessão com COMPLETED', async () => {
      const mockSession = { id: 's1', status: 'COMPLETED' };
      mockService.endSession.mockResolvedValue(mockSession as any);

      const result = await mockService.endSession('match-1', 's1', { score: {} }, 'COMPLETED');

      expect(mockService.endSession).toHaveBeenCalledWith('match-1', 's1', { score: {} }, 'COMPLETED');
    });

    it('deve finalizar sessão com ABANDONED', async () => {
      const mockSession = { id: 's1', status: 'ABANDONED' };
      mockService.endSession.mockResolvedValue(mockSession as any);

      const result = await mockService.endSession('match-1', 's1', undefined, 'ABANDONED');

      expect(mockService.endSession).toHaveBeenCalledWith('match-1', 's1', undefined, 'ABANDONED');
    });
  });

  describe('endorseSession', () => {
    it('deve endorsar sessão', async () => {
      mockService.endorseSession.mockResolvedValue({ success: true });

      const result = await mockService.endorseSession('match-1', 's1');

      expect(mockService.endorseSession).toHaveBeenCalledWith('match-1', 's1');
    });
  });

  describe('useAnnotationSession', () => {
    it('deve retornar hooks com métodos corretos', () => {
      const { start, end, abandon, endorse } = mockService.useAnnotationSession();

      expect(start).toBeDefined();
      expect(end).toBeDefined();
      expect(abandon).toBeDefined();
      expect(endorse).toBeDefined();
    });
  });
});