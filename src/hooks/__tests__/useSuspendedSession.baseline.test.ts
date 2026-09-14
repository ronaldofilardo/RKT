/**
 * @jest-environment jsdom
 *
 * Baseline: testes para useSuspendedSession.ts
 *
 * Captura o comportamento do hook quando suspendedSession é não-nulo,
 * incluindo cleanupAfterResume (que limpa suspendedSession) e os
 * caminhos de resumeFromSnapshotAhead / resumeFromBankAhead.
 * Serve como âncora para Item 1 (dedup) e Item 3 (scoreState reducer).
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSuspendedSession } from '../useSuspendedSession';
import type { SuspendedSessionState } from '../useSessionManager';
import type { MatchData } from '@/hooks/useScoringHandlers';

const mockMatch: MatchData = {
  id: 'match-1',
  format: 'BEST_OF_3',
  player1: { id: 'p1', name: 'Player 1' },
  player2: { id: 'p2', name: 'Player 2' },
  initialServerId: 'p1',
  scoreState: null,
  state: 'IN_PROGRESS',
  sportType: 'TENNIS',
  courtType: 'CLAY',
  version: 1,
  _count: { pointLog: 0 },
};

function createSuspendedSession(overrides: Partial<SuspendedSessionState> = {}): SuspendedSessionState {
  return {
    matchStateSnapshot: null,
    previousPointsCount: 0,
    snapshotStatus: 'BANK_AHEAD',
    snapshotPointCount: 0,
    bankPointCount: 0,
    bankScoreState: null,
    ...overrides,
  };
}

describe('useSuspendedSession — baseline', () => {
  const baseDeps = () => ({
    match: mockMatch,
    matchId: 'match-1',
    fetchMatch: jest.fn().mockResolvedValue(undefined),
    sessionIdRef: { current: null } as React.MutableRefObject<string | null>,
    tokenRef: { current: 'test-token' } as React.MutableRefObject<string | null>,
    engineRef: { current: null } as React.MutableRefObject<any>,
    setScoreState: jest.fn(),
    setSessionActive: jest.fn(),
    setSuspendedSession: jest.fn(),
    setFloorCurrentSets: jest.fn(),
    clearPendingEdit: jest.fn(),
    startSession: jest.fn().mockResolvedValue({ id: 'new-session' }),
  });

  describe('caminho BANK_AHEAD com bankScoreState', () => {
    it('inicia sessão, restaura engine e chama cleanupAfterResume', async () => {
      const suspended = createSuspendedSession({
        snapshotStatus: 'BANK_AHEAD',
        bankScoreState: {
          sets: [{ player1: 6, player2: 4, isTiebreak: false } as any],
          currentGame: { player1: 0, player2: 0 } as any,
          server: 'player1',
          isFinished: false,
          winner: null,
          setsWon: { player1: 1, player2: 0 },
          startedAt: Date.now(),
          secondServe: false,
        },
        bankPointCount: 10,
      });

      const deps = baseDeps();

      await act(async () => {
        renderHook(() =>
          useSuspendedSession({ suspendedSession: suspended, ...deps })
        );
      });

      await waitFor(() => {
        expect(deps.startSession).toHaveBeenCalledWith('match-1', false);
      });

      await waitFor(() => {
        expect(deps.setSessionActive).toHaveBeenCalledWith(true);
      });

      await waitFor(() => {
        expect(deps.setSuspendedSession).toHaveBeenCalledWith(null);
      });
    });

    it('cleanupAfterResume calcula floorCurrentSets do engine', async () => {
      const bankScore = {
        sets: [{ player1: 6, player2: 3, isTiebreak: false } as any],
        currentGame: { player1: 0, player2: 0 } as any,
        server: 'player1',
        isFinished: false,
        winner: null,
        setsWon: { player1: 1, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      };

      const suspended = createSuspendedSession({
        snapshotStatus: 'BANK_AHEAD',
        bankScoreState: bankScore as any,
        bankPointCount: 10,
      });

      const deps = baseDeps();

      await act(async () => {
        renderHook(() =>
          useSuspendedSession({ suspendedSession: suspended, ...deps })
        );
      });

      await waitFor(() => {
        expect(deps.setSuspendedSession).toHaveBeenCalledWith(null);
      });

      expect(deps.setFloorCurrentSets).toHaveBeenCalled();
    });
  });

  describe('caminho SNAPSHOT_AHEAD', () => {
    it('inicia sessão e sincroniza pontos offline', async () => {
      const snapshot = JSON.stringify({
        history: [
          {
            point: {
              winnerId: 'p1',
              type: 'FOREHAND',
              serverId: 'p1',
              isFirstServe: true,
              isSecondServe: false,
              timestamp: Date.now(),
            },
          },
        ],
      });

      const suspended = createSuspendedSession({
        snapshotStatus: 'SNAPSHOT_AHEAD',
        matchStateSnapshot: snapshot,
        bankPointCount: 0,
      });

      const deps = baseDeps();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scoreState: null }),
        status: 200,
      });

      await act(async () => {
        renderHook(() =>
          useSuspendedSession({ suspendedSession: suspended, ...deps })
        );
      });

      await waitFor(() => {
        expect(deps.startSession).toHaveBeenCalledWith('match-1', false);
      });

      await waitFor(() => {
        expect(deps.setSuspendedSession).toHaveBeenCalledWith(null);
      });

      jest.restoreAllMocks();
    });
  });

  describe('guarda: suspendedSession null', () => {
    it('não executa nenhum efeito quando suspendedSession é null', () => {
      const deps = baseDeps();

      renderHook(() =>
        useSuspendedSession({ suspendedSession: null, ...deps })
      );

      expect(deps.startSession).not.toHaveBeenCalled();
      expect(deps.setScoreState).not.toHaveBeenCalled();
      expect(deps.setSessionActive).not.toHaveBeenCalled();
      expect(deps.setSuspendedSession).not.toHaveBeenCalled();
    });
  });

  describe('guarda: match null', () => {
    it('não chama setScoreState nem setSessionActive quando match é null', () => {
      const deps = baseDeps();
      const suspended = createSuspendedSession();

      renderHook(() =>
        useSuspendedSession({ suspendedSession: suspended, match: null, ...deps })
      );

      expect(deps.setScoreState).not.toHaveBeenCalled();
      expect(deps.setSessionActive).not.toHaveBeenCalled();
    });
  });
});
