/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useSuspendedSession } from '../useSuspendedSession';
import type { SuspendedSessionState } from '../useSessionManager';
import type { MatchData } from '@/hooks/useScoringHandlers';

describe('useSuspendedSession', () => {
  const mockMatch: MatchData = {
    id: 'match-123',
    format: 'BEST_OF_3',
    state: 'IN_PROGRESS',
    player1: { id: 'p1', name: 'Jogador 1' },
    player2: { id: 'p2', name: 'Jogador 2' },
    initialServerId: 'p1',
    scoreState: {
      sets: [{ player1: 1, player2: 0, isTiebreak: false }],
      games: { player1: 1, player2: 0 },
      points: { player1: '0', player2: '0' },
      server: 'player1',
    },
    version: 1,
  };

  const createBaseConfig = (overrides = {}) => {
    const sessionIdRef = { current: null };
    const tokenRef = { current: 'mock-jwt-token' };
    const engineRef = {
      current: {
        getState: jest.fn().mockReturnValue({
          sets: [{ player1: 1, player2: 0, isTiebreak: false }],
        }),
        reconcileWithCanonicalState: jest.fn(),
      },
    };

    return {
      suspendedSession: null as SuspendedSessionState | null,
      match: mockMatch,
      matchId: 'match-123',
      fetchMatch: jest.fn().mockResolvedValue(undefined),
      sessionIdRef,
      tokenRef,
      engineRef,
      setScoreState: jest.fn(),
      setSessionActive: jest.fn(),
      setSuspendedSession: jest.fn(),
      setFloorCurrentSets: jest.fn(),
      clearPendingEdit: jest.fn(),
      startSession: jest.fn().mockResolvedValue({ id: 'sess-456' }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('não executa retomada se suspendedSession for nulo', async () => {
    const config = createBaseConfig({ suspendedSession: null });
    renderHook(() => useSuspendedSession(config));

    expect(config.startSession).not.toHaveBeenCalled();
    expect(config.setSessionActive).not.toHaveBeenCalled();
  });

  it('retoma sessão BANK_AHEAD e chama startSession apenas uma vez', async () => {
    const suspendedSession: SuspendedSessionState = {
      sessionId: 'sess-old',
      snapshotStatus: 'BANK_AHEAD',
      snapshotPointCount: 1,
      bankPointCount: 2,
      matchStateSnapshot: null,
      bankScoreState: {
        sets: [{ player1: 2, player2: 0, isTiebreak: false }],
      },
    };

    const config = createBaseConfig({ suspendedSession });
    const { rerender } = renderHook((cfg) => useSuspendedSession(cfg), {
      initialProps: config,
    });

    await waitFor(() => {
      expect(config.startSession).toHaveBeenCalledTimes(1);
    });

    expect(config.sessionIdRef.current).toBe('sess-456');
    expect(config.setSessionActive).toHaveBeenCalledWith(true);
    expect(config.setFloorCurrentSets).toHaveBeenCalledWith({ player1: 2, player2: 0 });
    expect(config.setSuspendedSession).toHaveBeenCalledWith(null);

    // Re-render com a mesma chave não deve disparar startSession novamente (evita loop e ruído no servidor)
    rerender(config);
    expect(config.startSession).toHaveBeenCalledTimes(1);
  });

  it('respeita resumedSessionKeyRef impedindo loop infinito em repouso', async () => {
    const suspendedSession: SuspendedSessionState = {
      sessionId: 'sess-ahead',
      snapshotStatus: 'SNAPSHOT_AHEAD',
      snapshotPointCount: 3,
      bankPointCount: 2,
      matchStateSnapshot: JSON.stringify({
        state: mockMatch.scoreState,
        history: [
          { point: { winnerId: 'p1', type: 'ACE', serverId: 'p1' } },
        ],
      }),
      bankScoreState: null,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _count: { pointLog: 2 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMatch, version: 3 }),
      });

    const config = createBaseConfig({ suspendedSession });
    const { rerender } = renderHook((cfg) => useSuspendedSession(cfg), {
      initialProps: config,
    });

    await waitFor(() => {
      expect(config.startSession).toHaveBeenCalledTimes(1);
    });

    // Múltiplos re-renders com a mesma sessão suspensa não re-executam
    rerender(config);
    rerender(config);

    expect(config.startSession).toHaveBeenCalledTimes(1);
  });
});
