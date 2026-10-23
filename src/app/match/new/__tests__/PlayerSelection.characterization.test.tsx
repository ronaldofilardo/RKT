/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerSelection } from '../components/PlayerSelection';
import type { Athlete } from '../types';

const athletes: Athlete[] = [
  { id: 'a1', name: 'Silva' },
  { id: 'a2', name: 'Santos' },
  { id: 'a3', name: 'Souza' },
  { id: 'a4', name: 'Oliveira' },
];

function baseProps() {
  return {
    athletes,
    selectedP1: null,
    selectedP2: null,
    player1DropdownOpen: false,
    player2DropdownOpen: false,
    onToggleP1: jest.fn(),
    onToggleP2: jest.fn(),
    onSelectP1: jest.fn(),
    onSelectP2: jest.fn(),
    onCreateNewP1: jest.fn(),
    onCreateNewP2: jest.fn(),
  };
}

describe('PlayerSelection characterization', () => {
  it('em SINGLES renderiza apenas Jogador 1 e Jogador 2 (sem parceiros)', () => {
    render(<PlayerSelection {...baseProps()} matchType="SINGLES" />);

    expect(screen.getByText('MODALIDADE & JOGADORES *')).toBeInTheDocument();
    expect(screen.getByText('Jogador 1')).toBeInTheDocument();
    expect(screen.getByText('Jogador 2')).toBeInTheDocument();
    expect(screen.queryByText('Parceiro 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Parceiro 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Dupla 1 (Lado A)')).not.toBeInTheDocument();
  });

  it('em DOUBLES renderiza 4 atletas com as secoes Dupla 1 e Dupla 2', () => {
    render(
      <PlayerSelection
        {...baseProps()}
        matchType="DOUBLES"
        player1PartnerDropdownOpen={false}
        player2PartnerDropdownOpen={false}
        onToggleP1Partner={jest.fn()}
        onToggleP2Partner={jest.fn()}
        onSelectP1Partner={jest.fn()}
        onSelectP2Partner={jest.fn()}
        onCreateNewP1Partner={jest.fn()}
        onCreateNewP2Partner={jest.fn()}
      />
    );

    expect(screen.getByText('Jogador 1')).toBeInTheDocument();
    expect(screen.getByText('Parceiro 1')).toBeInTheDocument();
    expect(screen.getByText('Jogador 2')).toBeInTheDocument();
    expect(screen.getByText('Parceiro 2')).toBeInTheDocument();
    expect(screen.getByText('Dupla 1 (Lado A)')).toBeInTheDocument();
    expect(screen.getByText('Dupla 2 (Lado B)')).toBeInTheDocument();
    expect(screen.queryByText('Dupla 2 (Lado A)')).not.toBeInTheDocument();
  });

  it('os botoes de modalidade disparam onMatchTypeChange com o tipo clicado', () => {
    const onMatchTypeChange = jest.fn();
    render(
      <PlayerSelection {...baseProps()} matchType="SINGLES" onMatchTypeChange={onMatchTypeChange} />
    );

    fireEvent.click(screen.getByText('Duplas (2 vs 2)'));
    expect(onMatchTypeChange).toHaveBeenCalledWith('DOUBLES');

    fireEvent.click(screen.getByText('Simples (1 vs 1)'));
    expect(onMatchTypeChange).toHaveBeenCalledWith('SINGLES');
  });

  it('oculta o seletor de modalidade quando onMatchTypeChange nao e fornecido', () => {
    render(<PlayerSelection {...baseProps()} matchType="SINGLES" />);

    expect(screen.queryByText('Simples (1 vs 1)')).not.toBeInTheDocument();
    expect(screen.queryByText('Duplas (2 vs 2)')).not.toBeInTheDocument();
    expect(screen.getByText('MODALIDADE & JOGADORES *')).toBeInTheDocument();
  });

  it('abre o dropdown do Jogador 1 ao clicar no botao dele', () => {
    const onToggleP1 = jest.fn();
    render(
      <PlayerSelection
        {...baseProps()}
        matchType="SINGLES"
        onToggleP1={onToggleP1}
        selectedP1={athletes[0]}
      />
    );

    fireEvent.click(screen.getByText('Silva'));
    expect(onToggleP1).toHaveBeenCalledTimes(1);
  });
});
