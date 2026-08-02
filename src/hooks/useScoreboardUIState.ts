'use client';

import { useReducer, useCallback } from 'react';

export interface FirstServeErrorDetail {
  errorType?: 'out' | 'net';
  serveEffect?: string;
  direction?: string;
}

export interface PendingServeError {
  errorType: 'out' | 'net';
  serveStep: 'first' | 'second';
}

export interface ScoreboardUIState {
  serveStep: 'none' | 'second';
  firstServeError: FirstServeErrorDetail | null;
  pendingServeError: PendingServeError | null;
  pendingDoubleFault: boolean;
  serveErrorStage: 'first' | 'second' | null;
  isServeErrorModalOpen: boolean;
}

type ScoreboardAction =
  | { type: 'SERVE_ERROR_OPEN'; error: { errorType: 'out' | 'net'; serveStep: 'first' | 'second' } }
  | { type: 'SERVE_ERROR_CLOSE' }
  | { type: 'FIRST_SERVE_ERROR_SET'; err: { errorType: 'out' | 'net'; serveEffect?: string; direction?: string } }
  | { type: 'FIRST_SERVE_ERROR_CLEAR' }
  | { type: 'SET_SERVE_STEP'; step: 'none' | 'second' };

export function scoreboardReducer(state: ScoreboardUIState, action: ScoreboardAction): ScoreboardUIState {
  switch (action.type) {
    case 'SERVE_ERROR_OPEN':
      return {
        ...state,
        pendingServeError: {
          errorType: action.error.errorType,
          serveStep: action.error.serveStep,
        },
        serveErrorStage: action.error.serveStep,
        isServeErrorModalOpen: true,
        pendingDoubleFault: action.error.serveStep === 'second',
      };
    case 'SERVE_ERROR_CLOSE':
      return {
        ...state,
        pendingServeError: null,
        serveErrorStage: null,
        isServeErrorModalOpen: false,
        pendingDoubleFault: false,
      };
    case 'FIRST_SERVE_ERROR_SET':
      return {
        ...state,
        firstServeError: {
          errorType: action.err.errorType,
          serveEffect: action.err.serveEffect,
          direction: action.err.direction,
        },
        serveStep: 'second',
        pendingServeError: null,
        serveErrorStage: null,
        isServeErrorModalOpen: false,
        pendingDoubleFault: false,
      };
    case 'FIRST_SERVE_ERROR_CLEAR':
      return {
        ...state,
        firstServeError: null,
        serveStep: 'none',
        pendingServeError: null,
        serveErrorStage: null,
        isServeErrorModalOpen: false,
        pendingDoubleFault: false,
      };
    case 'SET_SERVE_STEP':
      return {
        ...state,
        serveStep: action.step,
      };
    default:
      return state;
  }
}

const initialScoreboardState: ScoreboardUIState = {
  serveStep: 'none',
  firstServeError: null,
  pendingServeError: null,
  pendingDoubleFault: false,
  serveErrorStage: null,
  isServeErrorModalOpen: false,
};

export function useScoreboardUIState() {
  const [state, dispatch] = useReducer(scoreboardReducer, initialScoreboardState);

  const handleServeErrorOpen = useCallback((type: 'out' | 'net', step: 'first' | 'second') => {
    dispatch({ type: 'SERVE_ERROR_OPEN', error: { errorType: type, serveStep: step } });
  }, []);

  const handleServeErrorClose = useCallback(() => {
    dispatch({ type: 'SERVE_ERROR_CLOSE' });
  }, []);

  const handleFirstServeErrorSet = useCallback((err: { errorType: 'out' | 'net'; serveEffect?: string; direction?: string }) => {
    dispatch({ type: 'FIRST_SERVE_ERROR_SET', err });
  }, []);

  const handleFirstServeErrorClear = useCallback(() => {
    dispatch({ type: 'FIRST_SERVE_ERROR_CLEAR' });
  }, []);

  const setServeStep = useCallback((step: 'none' | 'second') => {
    dispatch({ type: 'SET_SERVE_STEP', step });
  }, []);

  return {
    state,
    dispatch,
    handleServeErrorOpen,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    setServeStep,
  };
}
