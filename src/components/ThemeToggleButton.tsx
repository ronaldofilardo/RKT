'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleButtonProps {
  className?: string;
}

/**
 * Botão único que alterna entre tema claro e escuro.
 * Mostra o ícone do tema PARA o qual vai alternar (☀️ no escuro, 🌙 no claro).
 * Quando a preferência é 'system', alterna a partir do tema resolvido.
 */
export function ThemeToggleButton({ className = '' }: ThemeToggleButtonProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';

  return (
    <button
      type="button"
      data-testid="theme-toggle-button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`bg-telemetry-elevated border border-white/10 p-2 rounded-lg hover:bg-telemetry-active ${className}`}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
    </button>
  );
}
