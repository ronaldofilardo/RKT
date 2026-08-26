/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useAnnotationSession } from '../useAnnotationSession';

describe('useAnnotationSession', () => {
  const matchId = 'match-123';
  const sessionId = 'session-456';

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'sessionStorage', {
      value: { getItem: jest.fn(() => 'mock-token') },
      configurable: true,
    });
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    })) as jest.Mock;
  });

  it('expõe start, end, abandon e endorse', () => {
    const { result } = renderHook(() => useAnnotationSession());

    expect(result.current.start).toEqual(expect.any(Function));
    expect(result.current.end).toEqual(expect.any(Function));
    expect(result.current.abandon).toEqual(expect.any(Function));
    expect(result.current.endorse).toEqual(expect.any(Function));
  });

  it('delega as operações aos endpoints corretos', async () => {
    const { result } = renderHook(() => useAnnotationSession());
    const finalState = { sets: [] };

    await result.current.start(matchId, true);
    await result.current.end(matchId, sessionId, finalState, 'COMPLETED');
    await result.current.abandon(matchId, sessionId, '{"sets":[]}');
    await result.current.endorse(matchId, sessionId);

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0][0]).toBe(`/api/matches/${matchId}/sessions`);
    expect(calls[0][1]).toEqual(expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ autoStarted: true }),
    }));
    expect(calls[1][0]).toBe(`/api/matches/${matchId}/sessions/${sessionId}`);
    expect(calls[1][1]).toEqual(expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED', finalState }),
    }));
    expect(calls[2][0]).toBe(`/api/matches/${matchId}/sessions/${sessionId}/abandon`);
    expect(calls[2][1]).toEqual(expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ matchStateSnapshot: '{"sets":[]}' }),
    }));
    expect(calls[3][0]).toBe(`/api/matches/${matchId}/sessions/${sessionId}/endorse`);
    expect(calls[3][1]).toEqual(expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({}),
    }));
  });

  it('propaga erros dos métodos de API', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API failure'));
    const { result } = renderHook(() => useAnnotationSession());

    await expect(result.current.start(matchId)).rejects.toThrow('API failure');
  });
});
