/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeAnnotationModal } from '../ResumeAnnotationModal';

describe('ResumeAnnotationModal Characterization', () => {
  const defaultProps = {
    player1Name: 'Carlos Alcaraz',
    player2Name: 'Daniil Medvedev',
    format: 'BEST_OF_3',
    matchStateSnapshot: null,
    previousPointsCount: 10,
    onResume: jest.fn(),
    onStartNew: jest.fn(),
    onDiscard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza os nomes dos jogadores e opções de ação quando sincronizado', () => {
    render(<ResumeAnnotationModal {...defaultProps} />);

    expect(screen.getByText(/Carlos Alcaraz vs Daniil Medvedev/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retomar \(com undo\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Começar Nova Anotação/i })).toBeInTheDocument();
  });

  it('chama onResume ao clicar em Retomar', () => {
    render(<ResumeAnnotationModal {...defaultProps} />);

    const resumeBtn = screen.getByRole('button', { name: /Retomar \(com undo\)/i });
    fireEvent.click(resumeBtn);

    expect(defaultProps.onResume).toHaveBeenCalledTimes(1);
  });

  it('chama onDiscard ao clicar em Descartar', () => {
    render(<ResumeAnnotationModal {...defaultProps} />);

    const discardBtn = screen.getByRole('button', { name: /Descartar/i });
    fireEvent.click(discardBtn);

    expect(defaultProps.onDiscard).toHaveBeenCalledTimes(1);
  });
});
