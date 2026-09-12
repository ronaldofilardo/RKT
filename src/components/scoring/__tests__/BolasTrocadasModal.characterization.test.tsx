/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BolasTrocadasModal } from '../BolasTrocadasModal';

describe('BolasTrocadasModal Characterization', () => {
  const defaultProps = {
    fontScale: 1,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o modal de troca de bolas', () => {
    render(<BolasTrocadasModal {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: /Modal de troca de bolas/i })).toBeInTheDocument();
    expect(screen.getByText('Bolas Trocadas')).toBeInTheDocument();
  });

  it('chama onConfirm com -1 ao clicar em Ignorar', () => {
    render(<BolasTrocadasModal {...defaultProps} />);

    const ignoreBtn = screen.getByRole('button', { name: /Ignorar/i });
    fireEvent.click(ignoreBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith(-1);
  });

  it('permite selecionar um número e confirmar', () => {
    render(<BolasTrocadasModal {...defaultProps} />);

    const fourBtn = screen.getByRole('button', { name: '4' });
    fireEvent.click(fourBtn);

    const confirmBtn = screen.getByRole('button', { name: /Confirmar/i });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith(4);
  });
});
