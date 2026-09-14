/**
 * @jest-environment jsdom
 *
 * Baseline: testes unitários para SessionContext.tsx
 *
 * Estes testes capturam o comportamento atual do reducer e dos callbacks
 * expostos pelo SessionProvider, servindo como âncora de regressão para a
 * refatoração de Item 1 (dedup pendingEditScore) e Item 3 (scoreState reducer).
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SessionProvider, useSession, useSessionForMatch } from '../SessionContext';
import type { ScoringState } from '@/core/scoring/types';

function wrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

function buildScoreState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 3, player2: 2, isTiebreak: false } as any],
    currentGame: { player1: 0, player2: 0 } as any,
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: Date.now(),
    secondServe: false,
    ...overrides,
  };
}

describe('SessionContext — baseline', () => {
  describe('estado inicial', () => {
    it('session começa com todos os campos nulos/defaults', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session.matchId).toBeNull();
      expect(result.current.session.sessionId).toBeNull();
      expect(result.current.session.bankScoreState).toBeNull();
      expect(result.current.session.matchStateSnapshot).toBeNull();
      expect(result.current.session.snapshotStatus).toBe('IN_SYNC');
      expect(result.current.session.snapshotPointCount).toBe(0);
      expect(result.current.session.bankPointCount).toBe(0);
      expect(result.current.session.suspendedSessionId).toBeNull();
      expect(result.current.session.pendingEditScore).toBeNull();
    });
  });

  describe('setSession', () => {
    it('atualiza todos os campos exceto pendingEditScore', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.setSession({
          matchId: 'm1',
          sessionId: 's1',
          bankScoreState: buildScoreState(),
          matchStateSnapshot: '{"history":[]}',
          snapshotStatus: 'IN_SYNC',
          snapshotPointCount: 5,
          bankPointCount: 3,
          suspendedSessionId: null,
        });
      });

      expect(result.current.session.matchId).toBe('m1');
      expect(result.current.session.sessionId).toBe('s1');
      expect(result.current.session.bankScoreState).toBeTruthy();
      expect(result.current.session.snapshotPointCount).toBe(5);
    });

    it('não toca pendingEditScore ao chamar setSession', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.setPendingEdit(buildScoreState(), null);
      });

      expect(result.current.session.pendingEditScore).not.toBeNull();

      act(() => {
        result.current.setSession({
          matchId: 'm2',
          sessionId: 's2',
          bankScoreState: null,
          matchStateSnapshot: null,
          snapshotStatus: 'IN_SYNC',
          snapshotPointCount: 0,
          bankPointCount: 0,
          suspendedSessionId: null,
        });
      });

      expect(result.current.session.pendingEditScore).not.toBeNull();
    });
  });

  describe('setPendingEdit / clearPendingEdit', () => {
    it('setPendingEdit armazena scoreState e floorSets', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      const score = buildScoreState({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });

      act(() => {
        result.current.setPendingEdit(score, { player1: 6, player2: 4 });
      });

      expect(result.current.session.pendingEditScore).toEqual({
        scoreState: score,
        floorSets: { player1: 6, player2: 4 },
      });
    });

    it('setPendingEdit com floorSets null', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.setPendingEdit(buildScoreState(), null);
      });

      expect(result.current.session.pendingEditScore).toEqual({
        scoreState: expect.any(Object),
        floorSets: null,
      });
    });

    it('clearPendingEdit limpa o pendingEditScore', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.setPendingEdit(buildScoreState(), null);
      });
      expect(result.current.session.pendingEditScore).not.toBeNull();

      act(() => {
        result.current.clearPendingEdit();
      });
      expect(result.current.session.pendingEditScore).toBeNull();
    });

    it('clearPendingEdit é seguro chamar quando já está null', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session.pendingEditScore).toBeNull();

      act(() => {
        result.current.clearPendingEdit();
      });

      expect(result.current.session.pendingEditScore).toBeNull();
    });
  });

  describe('updateScore', () => {
    it('atualiza bankScoreState', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      const newScore = buildScoreState({ server: 'player2' });

      act(() => {
        result.current.updateScore(newScore);
      });

      expect(result.current.session.bankScoreState).toBe(newScore);
    });
  });

  describe('clearSession', () => {
    it('reseta todo o estado para o initialState', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.setSession({
          matchId: 'm1',
          sessionId: 's1',
          bankScoreState: buildScoreState(),
          matchStateSnapshot: '{}',
          snapshotStatus: 'IN_SYNC',
          snapshotPointCount: 5,
          bankPointCount: 3,
          suspendedSessionId: 'ss1',
        });
      });

      act(() => {
        result.current.setPendingEdit(buildScoreState(), null);
      });

      act(() => {
        result.current.clearSession();
      });

      expect(result.current.session.matchId).toBeNull();
      expect(result.current.session.sessionId).toBeNull();
      expect(result.current.session.bankScoreState).toBeNull();
      expect(result.current.session.pendingEditScore).toBeNull();
      expect(result.current.session.suspendedSessionId).toBeNull();
    });
  });

  describe('useSessionForMatch', () => {
    it('isActive retorna true quando matchId bate e há snapshot', () => {
      const { result } = renderHook(() => useSessionForMatch('m1'), { wrapper });

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.setSession({
          matchId: 'm1',
          sessionId: 's1',
          bankScoreState: null,
          matchStateSnapshot: '{}',
          snapshotStatus: 'IN_SYNC',
          snapshotPointCount: 0,
          bankPointCount: 0,
          suspendedSessionId: null,
        });
      });

      expect(result.current.isActive).toBe(true);
    });

    it('isActive retorna false quando matchId não bate', () => {
      const { result } = renderHook(() => useSessionForMatch('m1'), { wrapper });
      const { result: result2 } = renderHook(() => useSessionForMatch('m2'), { wrapper });

      act(() => {
        result.current.setSession({
          matchId: 'm1',
          sessionId: 's1',
          bankScoreState: null,
          matchStateSnapshot: '{}',
          snapshotStatus: 'IN_SYNC',
          snapshotPointCount: 0,
          bankPointCount: 0,
          suspendedSessionId: null,
        });
      });

      expect(result.current.isActive).toBe(true);
      expect(result2.current.isActive).toBe(false);
    });

    it('setSession injeta matchId automaticamente', () => {
      const { result } = renderHook(() => useSessionForMatch('m1'), { wrapper });

      act(() => {
        result.current.setSession({
          matchId: 'ignored',
          sessionId: 's1',
          bankScoreState: null,
          matchStateSnapshot: null,
          snapshotStatus: 'IN_SYNC',
          snapshotPointCount: 0,
          bankPointCount: 0,
          suspendedSessionId: null,
        });
      });

      expect(result.current.session.matchId).toBe('m1');
    });
  });
});
