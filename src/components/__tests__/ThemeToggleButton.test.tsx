/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

function Resolved() {
  const { resolvedTheme } = useTheme();
  return <span data-testid="resolved-theme">{resolvedTheme}</span>;
}

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('renderiza um unico botao (sem os botoes separados claro/escuro)', () => {
    render(
      <ThemeProvider>
        <ThemeToggleButton />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-toggle-button')).toBeInTheDocument();
    expect(screen.queryByTestId('theme-toggle-light')).toBeNull();
    expect(screen.queryByTestId('theme-toggle-dark')).toBeNull();
  });

  it('alterna entre claro e escuro a cada clique', () => {
    render(
      <ThemeProvider>
        <ThemeToggleButton />
        <Resolved />
      </ThemeProvider>
    );
    const button = screen.getByTestId('theme-toggle-button');
    const first = screen.getByTestId('resolved-theme').textContent;

    fireEvent.click(button);
    const second = screen.getByTestId('resolved-theme').textContent;
    expect(second).not.toBe(first);
    expect(['light', 'dark']).toContain(second);

    fireEvent.click(button);
    expect(screen.getByTestId('resolved-theme').textContent).toBe(first);
  });
});
