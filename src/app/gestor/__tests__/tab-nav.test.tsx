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
});
