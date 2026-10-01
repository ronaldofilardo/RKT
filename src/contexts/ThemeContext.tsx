'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'rkt_theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Ler preferência salva ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved);
      }
    } catch {
      // Ignorar erros de localStorage (ex: SSR / modo privado)
    }
  }, []);

  // Atualizar classe no documento e tema resolvido
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const hasMatchMedia = typeof window.matchMedia === 'function';
    const mediaQuery = hasMatchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    const applyTheme = (currentPref: ThemePreference) => {
      const isSystemDark = mediaQuery ? mediaQuery.matches : true;
      const effectiveTheme: 'light' | 'dark' =
        currentPref === 'system' ? (isSystemDark ? 'dark' : 'light') : currentPref;

      setResolvedTheme(effectiveTheme);

      if (currentPref === 'system') {
        root.classList.remove('light', 'dark');
        root.removeAttribute('data-theme');
      } else if (currentPref === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    applyTheme(theme);

    if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
      const handleSystemChange = () => {
        if (theme === 'system') {
          applyTheme('system');
        }
      };

      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignorar erros de escrita
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
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
