'use client';

import { useReducer, useCallback } from 'react';
import { scoreboardReducer, initialScoreboardState } from './scoreboard-ui-state.reducer';

export { scoreboardReducer, initialScoreboardState } from './scoreboard-ui-state.reducer';
export type { ScoreboardUIState, ScoreboardAction } from './scoreboard-ui-state.reducer';

export function useScoreboardUIState() {
  const [state, dispatch] = useReducer(scoreboardReducer, initialScoreboardState);

  const openServeErrorModal = useCallback((type: 'out' | 'net', step: 'first' | 'second') => {
    dispatch({ type: 'SERVE_ERROR_OPEN', error: { errorType: type, serveStep: step } });
  }, []);

  const closeServeErrorModal = useCallback(() => {
    dispatch({ type: 'SERVE_ERROR_CLOSE' });
  }, []);

  const setFirstServeError = useCallback((err: { errorType: 'out' | 'net'; serveEffect?: string; direction?: string }) => {
    dispatch({ type: 'FIRST_SERVE_ERROR_SET', err });
  }, []);

  const clearFirstServeError = useCallback(() => {
    dispatch({ type: 'FIRST_SERVE_ERROR_CLEAR' });
  }, []);

  const setServeStep = useCallback((step: 'none' | 'second') => {
    dispatch({ type: 'SET_SERVE_STEP', step });
  }, []);

  return {
    state,
    dispatch,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
  };
}
