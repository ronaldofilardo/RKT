/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useSuspendedSession } from '../useSuspendedSession';

describe('useSuspendedSession - Regressoes Reais', () => {
  it('nao deve disparar efeitos colaterais quando suspendedSession e nulo', () => {
    const fetchMatch = jest.fn();
    const setScoreState = jest.fn();
    const setSessionActive = jest.fn();

    renderHook(() =>
      useSuspendedSession({
        suspendedSession: null,
        match: null,
        matchId: 'match-1',
        fetchMatch,
        sessionIdRef: { current: null },
        tokenRef: { current: null },
        engineRef: { current: null },
        setScoreState,
        setSessionActive,
        setSuspendedSession: jest.fn(),
        setFloorCurrentSets: jest.fn(),
        setPendingEditScore: jest.fn(),
        startSession: jest.fn(),
      })
    );

    expect(fetchMatch).not.toHaveBeenCalled();
    expect(setScoreState).not.toHaveBeenCalled();
    expect(setSessionActive).not.toHaveBeenCalled();
  });
});
