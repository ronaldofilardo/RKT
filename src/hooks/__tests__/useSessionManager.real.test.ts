/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useSessionManager } from '../useSessionManager';
import { ToastProvider } from '@/components/Toast';

describe('useSessionManager - Regressoes Reais', () => {
  it('deve inicializar o hook e retornar handlers de sessao operacionais', () => {
    const ctx = {
      matchId: 'm1',
      match: null,
      isLoading: false,
      engineRef: { current: null },
      tokenRef: { current: null },
      sessionIdRef: { current: null },
      matchIdRef: { current: 'm1' },
      suspendedSession: null,
      fetchMatch: jest.fn(),
      persistState: jest.fn(),
      setScoreState: jest.fn(),
      setSessionActive: jest.fn(),
      setFloorCurrentSets: jest.fn(),
      setPendingEditScore: jest.fn(),
      setSuspendedSession: jest.fn(),
    };

    const { result } = renderHook(() => useSessionManager(ctx as any), {
      wrapper: ToastProvider,
    });

    expect(typeof result.current.abandonCurrentSession).toBe('function');
    expect(typeof result.current.handleEditScore).toBe('function');
  });
});
