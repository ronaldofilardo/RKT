/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

function TestConsumer() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
    </div>
  );
}

describe('ThemeToggle & ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('renderiza os 3 botoes de tema: claro, sistema e escuro', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-toggle-light')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle-system')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle-dark')).toBeInTheDocument();
  });

  it('permite selecionar tema claro e aplica classes no documento', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
        <TestConsumer />
      </ThemeProvider>
    );

    const lightBtn = screen.getByTestId('theme-toggle-light');
    fireEvent.click(lightBtn);

    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('rkt_theme_preference')).toBe('light');
  });

  it('permite selecionar tema escuro e aplica classes no documento', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
        <TestConsumer />
      </ThemeProvider>
    );

    const darkBtn = screen.getByTestId('theme-toggle-dark');
    fireEvent.click(darkBtn);

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('rkt_theme_preference')).toBe('dark');
  });

  it('permite voltar ao modo sistema e remove overrides manuais', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
        <TestConsumer />
      </ThemeProvider>
    );

    // Primeiro vai para dark
    fireEvent.click(screen.getByTestId('theme-toggle-dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Volta para sistema
    fireEvent.click(screen.getByTestId('theme-toggle-system'));
    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('rkt_theme_preference')).toBe('system');
  });
});
