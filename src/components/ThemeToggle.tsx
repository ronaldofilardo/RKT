'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { THEME_OPTIONS } from './theme-toggle-options';

interface ThemeToggleProps {
  fullWidth?: boolean;
  className?: string;
}

export function ThemeToggle({ fullWidth = false, className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <div
      role="group"
      aria-label="Seleção de tema"
      className={`inline-flex items-center p-0.5 rounded-lg bg-telemetry-active/40 border border-white/10 ${
        fullWidth ? 'w-full justify-between' : ''
      } ${className}`}
    >
      {THEME_OPTIONS.map((opt) => {
        const isActive = currentTheme === opt.id;
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
