/**
 * @jest-environment jsdom
 */
import {
  listSessions,
  startSession,
  endSession,
  endorseSession,
  markSessionAbandoned,
} from '@/services/annotationSessionService';

describe('annotationSessionService (Real Service Calls)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem('access_token', 'test-session-token');
    global.fetch = jest.fn();
  });

  describe('listSessions', () => {
    it('deve chamar GET /api/matches/:id/sessions com token', async () => {
      const mockSessions = [{ id: 's1', annotatorUserId: 'u1' }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSessions),
      });

      const result = await listSessions('match-1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches/match-1/sessions',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-session-token',
          }),
        })
      );
      expect(result).toEqual(mockSessions);
    });
  });

  describe('startSession', () => {
    it('deve chamar POST /api/matches/:id/sessions com autoStarted', async () => {
      const mockSession = { id: 's1', matchId: 'match-1', isActive: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSession),
      });

      const result = await startSession('match-1', true);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches/match-1/sessions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ autoStarted: true }),
        })
      );
      expect(result).toEqual(mockSession);
    });
  });

  describe('endSession', () => {
    it('deve chamar PATCH /api/matches/:id/sessions/:id com status COMPLETED', async () => {
      const mockSession = { id: 's1', status: 'COMPLETED' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSession),
      });

      const result = await endSession('match-1', 's1', { score: {} }, 'COMPLETED');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches/match-1/sessions/s1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'COMPLETED', finalState: { score: {} } }),
        })
      );
      expect(result).toEqual(mockSession);
    });
  });

  describe('endorseSession', () => {
    it('deve chamar POST /api/matches/:id/sessions/:id/endorse', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const result = await endorseSession('match-1', 's1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches/match-1/sessions/s1/endorse',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual({ success: true });
    });
  });
});