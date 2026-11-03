/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchStatusBadge, FormatLabel } from '../match-card-components';

describe('src/components/dashboard/match-card-components.tsx Caracterizacao', () => {
  it('deve renderizar status Em Andamento quando isSuspended for false', () => {
    render(<MatchStatusBadge isSuspended={false} state="IN_PROGRESS" />);
    expect(screen.getByText('Em Andamento')).toBeInTheDocument();
  });

  it('deve renderizar status Suspensa quando isSuspended for true', () => {
    render(<MatchStatusBadge isSuspended={true} state="IN_PROGRESS" />);
    expect(screen.getByText('Suspensa')).toBeInTheDocument();
  });

  it('deve renderizar status Finalizada quando state for FINISHED', () => {
    render(<MatchStatusBadge isSuspended={false} state="FINISHED" />);
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
  });

  it('deve utilizar classes de contraste dual-theme em MatchStatusBadge para legibilidade no tema claro e escuro', () => {
    const { container: suspendedContainer } = render(<MatchStatusBadge isSuspended={true} state="IN_PROGRESS" />);
    const suspendedBadge = suspendedContainer.querySelector('span');
    expect(suspendedBadge?.className).toContain('text-amber-800');
    expect(suspendedBadge?.className).toContain('dark:text-amber-300');

    const { container: suspendedFinishedContainer } = render(<MatchStatusBadge isSuspended={true} state="FINISHED" />);
    const suspendedFinishedBadge = suspendedFinishedContainer.querySelector('span');
    expect(suspendedFinishedBadge?.className).toContain('text-amber-800');
    expect(suspendedFinishedBadge?.className).toContain('dark:text-amber-300');
  });

  it('deve renderizar a logo LIVE com imagem, tooltip e texto acessivel para partidas em andamento', () => {
    render(<MatchStatusBadge isSuspended={false} state="IN_PROGRESS" />);
    const img = screen.getByAltText('Em andamento');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/status/live.webp');
    expect(screen.getByTitle('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('Em Andamento')).toBeInTheDocument();
  });

  it('deve renderizar imagem e tooltip para partidas finalizadas e agendadas', () => {
    const { rerender } = render(<MatchStatusBadge isSuspended={false} state="FINISHED" />);
    const finishedImg = screen.getByAltText('Partida finalizada');
    expect(finishedImg).toHaveAttribute('src', '/status/finalizada.webp');
    expect(screen.getByTitle('Partida finalizada')).toBeInTheDocument();
    expect(screen.getByText('Finalizada')).toBeInTheDocument();

    rerender(<MatchStatusBadge isSuspended={false} state="SCHEDULED" />);
    const scheduledImg = screen.getByAltText('Partida agendada');
    expect(scheduledImg).toHaveAttribute('src', '/status/agendada.webp');
    expect(screen.getByTitle('Partida agendada')).toBeInTheDocument();
    expect(screen.getByText('Agendada')).toBeInTheDocument();
  });

it('deve renderizar FormatLabel utilizando text-telemetry-text-muted para legibilidade em ambos os temas', () => {
    const { container } = render(<FormatLabel format="BEST_OF_3" />);
    const spans = container.querySelectorAll('span');
    // Second span contains the format text with text-telemetry-text-muted
    const formatLabel = spans[1];
    expect(formatLabel?.className).toContain('text-telemetry-text-muted');
    expect(screen.getByText('Melhor de 3 Sets')).toBeInTheDocument();
    expect(screen.queryByText(/Modo de jogo:/i)).toBeNull();
  });
});
