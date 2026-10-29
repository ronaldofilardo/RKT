'use client';

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import {
  floatingSpectatorReducer,
  initialFloatingSpectatorState,
  type FloatingSpectatorState,
} from './floating-spectator.logic';

export interface FloatingSpectatorValue {
  state: FloatingSpectatorState;
  open: (matchId: string, title?: string) => void;
  close: (matchId: string) => void;
  toggleMinimize: (matchId: string) => void;
  focus: (matchId: string) => void;
  dismissLimit: () => void;
}

const FloatingSpectatorContext = createContext<FloatingSpectatorValue | null>(null);

export function FloatingSpectatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(floatingSpectatorReducer, initialFloatingSpectatorState);

  const open = useCallback((matchId: string, title?: string) => dispatch({ type: 'OPEN', matchId, title }), []);
  const close = useCallback((matchId: string) => dispatch({ type: 'CLOSE', matchId }), []);
  const toggleMinimize = useCallback((matchId: string) => dispatch({ type: 'TOGGLE_MINIMIZE', matchId }), []);
  const focus = useCallback((matchId: string) => dispatch({ type: 'FOCUS', matchId }), []);
  const dismissLimit = useCallback(() => dispatch({ type: 'DISMISS_LIMIT' }), []);

  const value = useMemo(
    () => ({ state, open, close, toggleMinimize, focus, dismissLimit }),
    [state, open, close, toggleMinimize, focus, dismissLimit],
  );

  return <FloatingSpectatorContext.Provider value={value}>{children}</FloatingSpectatorContext.Provider>;
}

/** Retorna null fora do provider (ex.: testes isolados), para o chamador usar um fallback. */
export function useFloatingSpectatorOptional(): FloatingSpectatorValue | null {
  return useContext(FloatingSpectatorContext);
}
