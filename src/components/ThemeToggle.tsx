'use client';

import React from 'react';
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  fullWidth?: boolean;
  className?: string;
}

export function ThemeToggle({ fullWidth = false, className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const options: Array<{
    id: ThemePreference;
    label: string;
    ariaLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'light',
      label: 'Claro',
      ariaLabel: 'Tema Claro',
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: 'system',
      label: 'Sistema',
      ariaLabel: 'Tema do Sistema',
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 'dark',
      label: 'Escuro',
      ariaLabel: 'Tema Escuro',
      icon: (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      role="group"
      aria-label="Seleção de tema"
      className={`inline-flex items-center p-0.5 rounded-lg bg-telemetry-active/40 border border-white/10 ${
        fullWidth ? 'w-full justify-between' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            data-testid={`theme-toggle-${opt.id}`}
            aria-label={opt.ariaLabel}
            aria-pressed={isActive}
            onClick={() => setTheme(opt.id)}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
              fullWidth ? 'flex-1' : ''
            } ${
              isActive
                ? 'bg-telemetry-card text-telemetry-text-primary shadow-sm font-semibold'
                : 'text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/5'
            }`}
          >
            {opt.icon}
            <span className={fullWidth ? 'inline' : 'hidden sm:inline'}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
