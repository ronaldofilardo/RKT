/**
 * @jest-environment jsdom
 */

'use client';

import { render, screen, fireEvent } from '@testing-library/react';
import { ServerSelectionModal } from '../ServerSelectionModal';
import type { Athlete } from '../../types';

describe('ServerSelectionModal', () => {
  const mockP1: Athlete = { id: 'p1-id', name: 'Player 1', document: '123' };
  const mockP2: Athlete = { id: 'p2-id', name: 'Player 2', document: '456' };

  const mockOnSelectServer = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não deve renderizar quando isOpen=false', () => {
    const { container } = render(
      <ServerSelectionModal
        isOpen={false}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('não deve renderizar quando selectedP1=null', () => {
    const { container } = render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={null}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('não deve renderizar quando selectedP2=null', () => {
    const { container } = render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={null}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('deve renderizar o modal com título "Quem saca primeiro?"', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Quem saca primeiro?')).toBeInTheDocument();
  });

  it('deve renderizar os botões com os nomes dos jogadores', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('deve chamar onSelectServer com id do P1 ao clicar no botão do Player 1', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    fireEvent.click(screen.getByText('Player 1'));
    expect(mockOnSelectServer).toHaveBeenCalledWith('p1-id');
    expect(mockOnSelectServer).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onSelectServer com id do P2 ao clicar no botão do Player 2', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    fireEvent.click(screen.getByText('Player 2'));
    expect(mockOnSelectServer).toHaveBeenCalledWith('p2-id');
    expect(mockOnSelectServer).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao clicar no backdrop', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    const backdrop = document.querySelector('.absolute.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('deve desabilitar os botões quando startingMatch=true', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={true}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    const p1Button = screen.getByText('Player 1').closest('button');
    const p2Button = screen.getByText('Player 2').closest('button');
    expect(p1Button).toBeDisabled();
    expect(p2Button).toBeDisabled();
  });

  it('deve mostrar spinner e texto "Iniciando partida..." quando startingMatch=true', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={true}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Iniciando partida...')).toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('NÃO deve mostrar spinner quando startingMatch=false', () => {
    render(
      <ServerSelectionModal
        isOpen={true}
        selectedP1={mockP1}
        selectedP2={mockP2}
        startingMatch={false}
        onSelectServer={mockOnSelectServer}
        onClose={mockOnClose}
      />
    );
    expect(screen.queryByText('Iniciando partida...')).not.toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });
});