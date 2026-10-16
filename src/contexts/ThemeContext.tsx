'use client';

import React, { createContext, useContext } from 'react';
import { useThemeProviderState, type ThemePreference } from './use-theme-provider-state';

export type { ThemePreference };

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const state = useThemeProviderState();

  return (
    <ThemeContext.Provider value={state}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'system' as const,
      resolvedTheme: 'dark' as const,
      setTheme: () => {},
    };
  }
  return context;
}
