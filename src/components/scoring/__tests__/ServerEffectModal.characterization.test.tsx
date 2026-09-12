/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServerEffectModal } from '../ServerEffectModal';

describe('ServerEffectModal Characterization', () => {
  const defaultProps = {
    context: 'winner' as const,
    serveStep: 'first' as const,
    winnerName: 'Carlos Alcaraz',
    fontScale: 1,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o modal com o nome do vencedor e opções de efeito', () => {
    render(<ServerEffectModal {...defaultProps} />);

    expect(screen.getByText('Carlos Alcaraz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TopSpin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flat' })).toBeInTheDocument();
  });

  it('permite selecionar efeito e direção e confirmar', () => {
    render(<ServerEffectModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Slice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aberto' }));

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Ponto/i });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith('slice', 'aberto');
  });

  it('chama onCancel ao cancelar sem alterações', () => {
    render(<ServerEffectModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
