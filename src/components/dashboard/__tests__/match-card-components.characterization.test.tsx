/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchStatusBadge } from '../match-card-components';

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
});
