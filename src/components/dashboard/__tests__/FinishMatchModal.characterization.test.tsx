/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinishMatchModal } from '../FinishMatchModal';

describe('FinishMatchModal Characterization', () => {
  const defaultProps = {
    matchId: 'match-1',
    matchState: 'IN_PROGRESS',
    player1Name: 'Rafael Nadal',
    player2Name: 'Novak Djokovic',
    onConfirm: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and players label properly', () => {
    render(<FinishMatchModal {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2, name: /Encerrar Partida/i })).toBeInTheDocument();
    expect(screen.getByText('Rafael Nadal vs Novak Djokovic')).toBeInTheDocument();
  });

  it('calls onCancel when clicking cancel button', () => {
    render(<FinishMatchModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm with selected reason', async () => {
    render(<FinishMatchModal {...defaultProps} />);

    const confirmBtn = screen.getByRole('button', { name: 'Encerrar Partida' });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith('COMPLETED', undefined);
  });
});
