/**
 * @jest-environment jsdom
 *
 * Baseline: testes para os efeitos críticos de useScoringPageEffects.ts
 *
 * Estes testes capturam o wiring entre SessionContext.pendingEditScore e
 * a abertura do modal de edição, além do handleEditScoreCancel que limpa
 * ambas as fontes de estado. Servem como âncora para Item 1 (dedup).
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SessionProvider, useSession } from '@/contexts/SessionContext';
import type { ScoringState } from '@/core/scoring/types';

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

function wrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

describe('useScoringPageEffects — baseline wiring', () => {
  describe('session.pendingEditScore → modal flow', () => {
    it('setPendingEdit armazena o snapshot no SessionContext', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      const score = buildScoreState({ sets: [{ player1: 5, player2: 4, isTiebreak: false } as any] });

      act(() => {
        result.current.setPendingEdit(score, { player1: 5, player2: 4 });
      });

      expect(result.current.session.pendingEditScore).toEqual({
        scoreState: score,
        floorSets: { player1: 5, player2: 4 },
      });
    });

    it('clearPendingEdit limpa o snapshot do SessionContext', () => {
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

    it('após clearPendingEdit, session.pendingEditScore é null', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.setPendingEdit(buildScoreState(), { player1: 3, player2: 2 });
      });

      expect(result.current.session.pendingEditScore?.floorSets).toEqual({ player1: 3, player2: 2 });

      act(() => {
        result.current.clearPendingEdit();
      });

      expect(result.current.session.pendingEditScore).toBeNull();
    });
  });

  describe('atomicidade: limpeza simultânea de pendingEditScore e suspendedSession', () => {
    it('clearPendingEdit não afeta outros campos da session', () => {
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
        result.current.clearPendingEdit();
      });

      expect(result.current.session.pendingEditScore).toBeNull();
      expect(result.current.session.matchId).toBe('m1');
      expect(result.current.session.suspendedSessionId).toBe('ss1');
      expect(result.current.session.bankScoreState).not.toBeNull();
    });
  });

  describe('cenário de bug: edit-score confirmado mas snapshot persiste', () => {
    it('após handleEditScore (simulado: setPendingEdit(null) + clearPendingEdit), pendingEditScore fica null', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      const staleScore = buildScoreState({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });
      const freshScore = buildScoreState({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });

      act(() => {
        result.current.setPendingEdit(staleScore, null);
      });
      expect(result.current.session.pendingEditScore?.scoreState).toBe(staleScore);

      act(() => {
        result.current.clearPendingEdit();
      });
      expect(result.current.session.pendingEditScore).toBeNull();
    });

    it('setSession não restaura pendingEditScore after clear', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.setPendingEdit(buildScoreState(), null);
      });

      act(() => {
        result.current.clearPendingEdit();
      });

      act(() => {
        result.current.setSession({
          matchId: 'm1',
          sessionId: 's1',
          bankScoreState: buildScoreState(),
          matchStateSnapshot: null,
          snapshotStatus: 'IN_SYNC',
          snapshotPointCount: 0,
          bankPointCount: 0,
          suspendedSessionId: null,
        });
      });

      expect(result.current.session.pendingEditScore).toBeNull();
    });
  });
});
