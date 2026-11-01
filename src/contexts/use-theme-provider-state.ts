'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'rkt_theme_preference';

export function useThemeProviderState() {
  const [theme, setThemeState] = useState<ThemePreference>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Ler preferência salva ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
      } else {
        setThemeState('dark');
      }
    } catch (error) {
      logger.warn('[THEME] Falha ao ler preferência de tema do localStorage:', error);
    }
  }, []);

  // Atualizar classe no documento e tema resolvido
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const effectiveTheme: 'light' | 'dark' = theme === 'light' ? 'light' : 'dark';

    setResolvedTheme(effectiveTheme);

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const setTheme = (newTheme: ThemePreference) => {
    const target = newTheme === 'light' ? 'light' : 'dark';
    setThemeState(target);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, target);
    } catch (error) {
      logger.warn('[THEME] Falha ao gravar preferência de tema no localStorage:', error);
    }
  };

  return { theme, resolvedTheme, setTheme };
}
