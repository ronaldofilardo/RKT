/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabNav } from '../tab-nav';

describe('TabNav - Painel do Gestor', () => {
  it('renderiza as abas e os badges numéricos correspondentes', () => {
    const handleTabChange = jest.fn();
    render(
      <TabNav
        tab="coaches"
        onTabChange={handleTabChange}
        coachesCount={1}
        athletesCount={4}
        affiliatesCount={10}
        matchesCount={6}
      />
    );

    expect(screen.getByRole('button', { name: /Treinadores 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Atletas 4/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Afiliados 10/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Partidas 6/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clube/i })).toBeInTheDocument();
  });

  it('chama onTabChange quando uma aba é clicada', () => {
    const handleTabChange = jest.fn();
    render(
      <TabNav
        tab="coaches"
        onTabChange={handleTabChange}
        coachesCount={2}
        athletesCount={5}
        affiliatesCount={7}
        matchesCount={3}
      />
    );

    const affiliatesBtn = screen.getByRole('button', { name: /Afiliados 7/i });
    fireEvent.click(affiliatesBtn);
    expect(handleTabChange).toHaveBeenCalledWith('affiliates');
  });

  it('aplica classes de alto contraste na aba ativa e seus badges (sem contraste escuro ilegível)', () => {
    const handleTabChange = jest.fn();
    render(
      <TabNav
        tab="coaches"
        onTabChange={handleTabChange}
        coachesCount={1}
        athletesCount={4}
      />
    );

    const activeBtn = screen.getByRole('button', { name: /Treinadores 1/i });
    const inactiveBtn = screen.getByRole('button', { name: /Atletas 4/i });

    // Aba ativa usa text-white de máximo contraste e borda telemetry-blue-light
    expect(activeBtn.className).toContain('text-white');
    expect(activeBtn.className).toContain('border-telemetry-blue-light');
    expect(activeBtn.className).not.toContain('text-telemetry-blue ');

    // Badge ativo
    const activeBadge = activeBtn.querySelector('span');
    expect(activeBadge?.className).toContain('text-telemetry-blue-light');
    expect(activeBadge?.className).toContain('bg-telemetry-blue/40');

    // Aba inativa
    expect(inactiveBtn.className).toContain('text-telemetry-text-muted');

    // Badge inativo tem contraste claro/suave e não azul escuro ilegível
    const inactiveBadge = inactiveBtn.querySelector('span');
    expect(inactiveBadge?.className).toContain('text-telemetry-text-muted');
    expect(inactiveBadge?.className).toContain('bg-telemetry-border/10');
  });
});
