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
        matchesCount={6}
      />
    );

    expect(screen.getByRole('button', { name: /Treinadores 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Atletas 4/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Partidas do Clube 6/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clubes & CTs/i })).toBeInTheDocument();
  });

  it('chama onTabChange quando uma aba é clicada', () => {
    const handleTabChange = jest.fn();
    render(
      <TabNav
        tab="coaches"
        onTabChange={handleTabChange}
        coachesCount={2}
        athletesCount={5}
        matchesCount={3}
      />
    );

    const athletesBtn = screen.getByRole('button', { name: /Atletas 5/i });
    fireEvent.click(athletesBtn);
    expect(handleTabChange).toHaveBeenCalledWith('athletes');
  });
});

