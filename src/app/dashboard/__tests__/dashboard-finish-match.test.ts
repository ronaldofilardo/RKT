/**
 * @jest-environment jsdom
 */
import { useFinishMatch } from '../dashboard-finish-match.logic';
import { renderHook, act } from '@testing-library/react';

describe('useFinishMatch', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('finaliza partida registrando comentário final e chamando /finish', async () => {
    const setMatchToFinish = jest.fn();
    const fetchDashboardData = jest.fn();
    const toast = jest.fn();

    const matchToFinish = {
      id: 'match-123',
      scoreState: { isFinished: true },
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'comment-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const { result } = renderHook(() =>
      useFinishMatch({
        matchToFinish,
        setMatchToFinish,
        fetchDashboardData,
        toast,
      })
    );

    await act(async () => {
      await result.current.confirmFinishMatch('Ótima partida!');
    });

    // 1. Chamou /comments com o texto
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/matches/match-123/comments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          content: 'Ótima partida!',
          category: 'GERAL',
        }),
      })
    );

    // 2. Chamou /finish com note e reason
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/matches/match-123/finish',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reason: 'COMPLETED',
          note: 'Ótima partida!',
          scoreState: { isFinished: true },
        }),
      })
    );

    expect(toast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Partida finalizada com sucesso!',
    });
    expect(setMatchToFinish).toHaveBeenCalledWith(null);
    expect(fetchDashboardData).toHaveBeenCalled();
  });
});
