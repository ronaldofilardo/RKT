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
    const { container: inProgressContainer } = render(<MatchStatusBadge isSuspended={false} state="IN_PROGRESS" />);
    const inProgressBadge = inProgressContainer.querySelector('span');
    expect(inProgressBadge?.className).toContain('text-emerald-800');
    expect(inProgressBadge?.className).toContain('dark:text-emerald-300');

    const { container: finishedContainer } = render(<MatchStatusBadge isSuspended={false} state="FINISHED" />);
    const finishedBadge = finishedContainer.querySelector('span');
    expect(finishedBadge?.className).toContain('text-slate-800');
    expect(finishedBadge?.className).toContain('dark:text-slate-200');
  });

  it('deve renderizar FormatLabel utilizando text-telemetry-text-muted para legibilidade em ambos os temas', () => {
    const { container } = render(<FormatLabel format="BEST_OF_3" />);
    const label = container.querySelector('span');
    expect(label?.className).toContain('text-telemetry-text-muted');
    expect(screen.getByText(/Modo de jogo:/i)).toBeInTheDocument();
  });
});
