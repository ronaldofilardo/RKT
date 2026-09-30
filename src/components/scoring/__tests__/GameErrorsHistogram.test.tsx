/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameErrorsHistogram } from '../GameErrorsHistogram';
import type { GameErrorEntry } from '@/core/scoring/set-summary-stats';

describe('GameErrorsHistogram Component', () => {
  const p1Name = 'Carlos Alcaraz';
  const p2Name = 'Jannik Sinner';

  it('exibe mensagem quando não há games gravados', () => {
    render(
      <GameErrorsHistogram
        gameErrors={[]}
        player1Name={p1Name}
        player2Name={p2Name}
      />
    );

    expect(screen.getByText('Nenhum registro de erros disponível neste set.')).toBeInTheDocument();
  });

  it('renderiza games, legendas e barras proporcionais para cada jogador', () => {
    const mockGames: GameErrorEntry[] = [
      {
        gameIndex: 1,
        server: 'player1',
        scoreLabel: '1-0',
        isTiebreak: false,
        winner: 'player1',
        p1Errors: { unforced: 1, forced: 0, total: 1 },
        p2Errors: { unforced: 3, forced: 1, total: 4 },
      },
      {
        gameIndex: 2,
        server: 'player2',
        scoreLabel: '1-1',
        isTiebreak: false,
        winner: 'player2',
        p1Errors: { unforced: 2, forced: 0, total: 2 },
        p2Errors: { unforced: 0, forced: 0, total: 0 },
      },
    ];

    const { container } = render(
      <GameErrorsHistogram
        gameErrors={mockGames}
        player1Name={p1Name}
        player2Name={p2Name}
      />
    );

    // Legenda dos jogadores
    expect(screen.getByText(p1Name)).toBeInTheDocument();
    expect(screen.getByText(p2Name)).toBeInTheDocument();

    // Rótulos de games e placar
    expect(screen.getByText('G1')).toBeInTheDocument();
    expect(screen.getByText('1-0')).toBeInTheDocument();
    expect(screen.getByText('G2')).toBeInTheDocument();
    expect(screen.getByText('1-1')).toBeInTheDocument();

    // Quantidades numéricas de erros renderizadas acima das barras
    expect(screen.getByText('4')).toBeInTheDocument(); // P2 no G1

    // Rodapé com escala máxima (o max de erros foi 4)
    expect(screen.getByText('Escala máx: 4 erros/game')).toBeInTheDocument();

    // Presença de elementos SVG
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(3); // P1 G1, P2 G1, P1 G2
  });
});
