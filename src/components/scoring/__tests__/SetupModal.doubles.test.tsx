/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetupModal } from '../SetupModal';

describe('SetupModal - Suporte a 4 nomes em Duplas', () => {
  const p1 = { id: 'p1', name: 'Carlos Alcaraz' };
  const p2 = { id: 'p2', name: 'Jannik Sinner' };
  const p1Partner = { id: 'p1p', name: 'Rafael Nadal' };
  const p2Partner = { id: 'p2p', name: 'Novak Djokovic' };

  it('renderiza os 4 nomes de atletas em Duplas (Dupla 1 e Dupla 2)', () => {
    const onSelectServer = jest.fn();

    render(
      <SetupModal
        player1={p1}
        player2={p2}
        player1Partner={p1Partner}
        player2Partner={p2Partner}
        onSelectServer={onSelectServer}
      />
    );

    expect(screen.getByText('Quem saca primeiro?')).toBeInTheDocument();
    expect(screen.getByText('Dupla 1')).toBeInTheDocument();
    expect(screen.getByText('Dupla 2')).toBeInTheDocument();

    // 4 nomes abreviados devem estar presentes como botões
    expect(screen.getByRole('button', { name: 'C. Alcaraz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'R. Nadal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'J. Sinner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'N. Djokovic' })).toBeInTheDocument();

    // Clicar no parceiro da Dupla 1 deve disparar onSelectServer com o ID dele
    fireEvent.click(screen.getByRole('button', { name: 'R. Nadal' }));
    expect(onSelectServer).toHaveBeenCalledWith('p1p');
  });

  it('renderiza apenas 2 jogadores no formato padrão de Simples', () => {
    const onSelectServer = jest.fn();

    render(
      <SetupModal
        player1={p1}
        player2={p2}
        onSelectServer={onSelectServer}
      />
    );

    expect(screen.getByRole('button', { name: 'Carlos Alcaraz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jannik Sinner' })).toBeInTheDocument();
    expect(screen.queryByText('Dupla 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Dupla 2')).not.toBeInTheDocument();
  });
});
