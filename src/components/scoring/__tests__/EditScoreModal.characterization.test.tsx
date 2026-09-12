/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditScoreModal } from '../EditScoreModal';

describe('EditScoreModal Characterization', () => {
  const defaultProps = {
    isOpen: true,
    matchFormat: 'BEST_OF_3' as const,
    playerNames: { p1: 'Roger Federer', p2: 'Rafael Nadal' },
    currentSets: { player1: 0, player2: 0 },
    currentServer: 'player1' as const,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não renderiza conteúdo quando isOpen é false', () => {
    const { container } = render(<EditScoreModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o cabeçalho e os nomes dos jogadores quando aberto', () => {
    render(<EditScoreModal {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2, name: /Editar Placar/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Roger Federer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rafael Nadal/i).length).toBeGreaterThan(0);
  });

  it('chama onCancel ao clicar no botão Cancelar', () => {
    render(<EditScoreModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
