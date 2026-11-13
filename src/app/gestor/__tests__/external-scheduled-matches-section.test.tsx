/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExternalScheduledMatchesSection } from '../external-scheduled-matches-section';
import type { ClubMatchItem } from '../types';

describe('ExternalScheduledMatchesSection', () => {
  it('não renderiza nada quando externalMatches for vazio', () => {
    const { container } = render(<ExternalScheduledMatchesSection externalMatches={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza título, confronto e botão de indicação quando há partidas agendadas por outros', () => {
    const onAssignMock = jest.fn();
    const mockMatches: ClubMatchItem[] = [
      {
        id: 'ext-m1',
        format: 'BEST_OF_3',
        state: 'PENDING',
        createdAt: '2026-11-12T10:00:00.000Z',
        startedAt: null,
        finishedAt: null,
        createdByUserId: 'external-coach',
        player1: { id: 'p1', name: 'Atleta do Clube', club: 'Meu Clube' },
        player2: { id: 'p2', name: 'Atleta Externo', club: 'Outro' },
        createdByUser: { id: 'external-coach', name: 'Treinador Externo', email: 'coach@test.com' },
      },
    ];

    render(
      <ExternalScheduledMatchesSection
        externalMatches={mockMatches}
        onAssignCoach={onAssignMock}
      />,
    );

    expect(screen.getByText(/Partidas agendadas por outros/i)).toBeInTheDocument();
    expect(screen.getByText('Atleta do Clube')).toBeInTheDocument();
    expect(screen.getByText('Atleta Externo')).toBeInTheDocument();
    expect(screen.getByText('Treinador Externo')).toBeInTheDocument();

    const assignBtn = screen.getByRole('button', { name: /Indicar Anotador/i });
    fireEvent.click(assignBtn);
    expect(onAssignMock).toHaveBeenCalledWith(mockMatches[0]);
  });
});
