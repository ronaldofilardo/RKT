/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SetsSummary } from '../edit-score-summary';

describe('edit-score-summary Characterization', () => {
  const playerNames = { p1: 'Alcaraz', p2: 'Sinner' };

  it('retorna null quando a lista de sets está vazia', () => {
    const { container } = render(
      <SetsSummary title="Sets Finalizados" sets={[]} playerNames={playerNames} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o resumo dos sets com os placares e nomes', () => {
    render(
      <SetsSummary
        title="Sets Finalizados"
        sets={[
          { p1Games: 6, p2Games: 4, winner: 'player1' },
          { p1Games: 3, p2Games: 6, winner: 'player2' },
        ]}
        playerNames={playerNames}
      />
    );

    expect(screen.getByText('Sets Finalizados')).toBeInTheDocument();
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
    expect(screen.getAllByText('6').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getByText('Alcaraz')).toBeInTheDocument();
    expect(screen.getByText('Sinner')).toBeInTheDocument();
  });
});
