/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteMatchModal } from '../DeleteMatchModal';

describe('DeleteMatchModal Characterization', () => {
  const defaultProps = {
    matchId: 'match-1',
    matchState: 'SCHEDULED',
    player1Name: 'Carlos Alcaraz',
    player2Name: 'Jannik Sinner',
    onConfirm: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and players label properly', () => {
    render(<DeleteMatchModal {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2, name: /Excluir Partida/i })).toBeInTheDocument();
    expect(screen.getByText('Carlos Alcaraz vs Jannik Sinner')).toBeInTheDocument();
  });

  it('calls onCancel when clicking cancel button', () => {
    render(<DeleteMatchModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirming deletion', async () => {
    render(<DeleteMatchModal {...defaultProps} />);

    const confirmBtn = screen.getByRole('button', { name: /Marcar como Cancelada/i });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith('soft', undefined);
  });
});
