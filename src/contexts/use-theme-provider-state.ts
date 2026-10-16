'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'rkt_theme_preference';

export function useThemeProviderState() {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Ler preferência salva ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved);
      }
    } catch (error) {
      logger.warn('[THEME] Falha ao ler preferência de tema do localStorage:', error);
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
      const onSystemThemeChange = () => {
        if (theme === 'system') {
          applyTheme('system');
        }
      };

      mediaQuery.addEventListener('change', onSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      logger.warn('[THEME] Falha ao gravar preferência de tema no localStorage:', error);
    }
  };

  return { theme, resolvedTheme, setTheme };
}
