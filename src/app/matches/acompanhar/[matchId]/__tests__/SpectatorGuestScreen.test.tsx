/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpectatorHeader } from '../SpectatorHeader';
import { SpectatorScoreboard } from '../SpectatorScoreboard';
import { SpectatorLastPointBanner } from '../SpectatorLastPointBanner';
import { SpectatorTabs } from '../SpectatorTabs';
import { SpectatorScoreAnnouncer } from '../SpectatorScoreAnnouncer';

describe('Spectator Guest Screen Components', () => {
  const mockMatch = {
    id: 'm1',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    matchType: 'SINGLES' as const,
    sides: [
      { label: 'Ana S.', members: [{ id: 'p1', name: 'Ana S.' }] },
      { label: 'Bia L.', members: [{ id: 'p2', name: 'Bia L.' }] },
    ],
  };

  const mockScore = {
    sets: [
      { player1: 6, player2: 4 },
      { player1: 3, player2: 2 },
    ],
    currentGame: { player1: '40', player2: '30' },
    serverSide: 'side1' as const,
  };

  const mockPoints = [
    {
      id: 'pt1',
      sequenceNumber: 1,
      setNumber: 2,
      gameNumber: 4,
      scoreBefore: '30-15',
      scoreAfter: '30-30',
      winnerSide: 'side2' as const,
      type: 'WINNER DE DIREITA',
    },
    {
      id: 'pt2',
      sequenceNumber: 2,
      setNumber: 2,
      gameNumber: 4,
      scoreBefore: '30-30',
      scoreAfter: '40-30',
      winnerSide: 'side1' as const,
      type: 'ACE',
    },
  ];

  it('SpectatorHeader renders match title, status badge and relative time', () => {
    render(
      <SpectatorHeader match={mockMatch} status="LIVE" updateText="Atualizado há 3 s" />
    );

    expect(screen.getByText('Ana S. × Bia L.')).toBeInTheDocument();
    expect(screen.getByText('Ao vivo')).toBeInTheDocument();
    expect(screen.getByText('Atualizado há 3 s')).toBeInTheDocument();
    expect(screen.getByLabelText('Voltar')).toBeInTheDocument();
  });

  it('SpectatorScoreboard renders the /scoring table pattern (Set N, server, game column)', () => {
    render(
      <SpectatorScoreboard view={{ match: mockMatch, score: mockScore, points: mockPoints }} />
    );

    // Mesmo padrão do /scoring: colunas "Set N", nomes abreviados e coluna do game.
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
    expect(screen.getByText('Set 3')).toBeInTheDocument();
    expect(screen.getByText('Pts')).toBeInTheDocument();
    expect(screen.getByText('A. S.')).toBeInTheDocument();
    expect(screen.getByText('B. L.')).toBeInTheDocument();
    expect(screen.getByLabelText('Sacador')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('SpectatorLastPointBanner renders single-line accent banner', () => {
    render(
      <SpectatorLastPointBanner
        lastPoint={mockPoints[1]}
        winnerName="Ana S."
      />
    );

    expect(screen.getByText('Último ponto · Ana S. · ace')).toBeInTheDocument();
  });

  it('SpectatorTabs switches between Pontos, Resumo and Estatísticas', () => {
    render(
      <SpectatorTabs view={{ match: mockMatch, score: mockScore, points: mockPoints }} />
    );

    expect(screen.getByRole('button', { name: 'Pontos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resumo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Estatísticas' })).toBeInTheDocument();

    // Timeline is shown on Pontos tab
    expect(screen.getByText('G4 · 40-30')).toBeInTheDocument();
    expect(screen.getByText('Ana S. · ace')).toBeInTheDocument();

    // Click Resumo
    fireEvent.click(screen.getByRole('button', { name: 'Resumo' }));
    expect(screen.getByText('Total de Pontos')).toBeInTheDocument();

    // Click Estatísticas
    fireEvent.click(screen.getByRole('button', { name: 'Estatísticas' }));
    expect(screen.getByText('Aces')).toBeInTheDocument();
  });

  it('SpectatorScoreAnnouncer only announces on game or set changes (aria-live polite)', () => {
    const { rerender } = render(
      <SpectatorScoreAnnouncer
        score={mockScore}
        side1Label="Ana S."
        side2Label="Bia L."
      />
    );

    const liveRegion = screen.getByText((content, element) => {
      return element?.getAttribute('aria-live') === 'polite';
    });
    expect(liveRegion).toBeInTheDocument();

    // Rerender with point change only (same sets, same games) -> no new announcement
    rerender(
      <SpectatorScoreAnnouncer
        score={{ ...mockScore, currentGame: { player1: 'AD', player2: '40' } }}
        side1Label="Ana S."
        side2Label="Bia L."
      />
    );
    expect(liveRegion.textContent).toBe('');

    // Rerender with game won (game changed from 3-2 to 4-2)
    rerender(
      <SpectatorScoreAnnouncer
        score={{
          ...mockScore,
          sets: [{ player1: 6, player2: 4 }, { player1: 4, player2: 2 }],
          currentGame: { player1: '0', player2: '0' },
        }}
        side1Label="Ana S."
        side2Label="Bia L."
      />
    );
    expect(liveRegion.textContent).toContain('Game encerrado');
  });
});

