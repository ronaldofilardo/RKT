/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WhereWinnerBar } from '../WhereWinnerBar';

describe('WhereWinnerBar — Opções de onde estava o vencedor', () => {
  it('quando howEnded é WINNER: exibe 4 botões com Devolvendo habilitado', () => {
    const onSelect = jest.fn();
    render(<WhereWinnerBar onSelect={onSelect} selected={null} howEnded="WINNER" />);

    expect(screen.getByRole('button', { name: 'Devolvendo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Fundo de quadra' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Voleando (na rede)' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Passando o jogador da rede' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Sacando' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Devolvendo' }));
    expect(onSelect).toHaveBeenCalledWith('devolvendo');
  });

  it('quando howEnded é ERRO_FORCADO: exibe 5 botões com Devolvendo desabilitado e Sacando habilitado', () => {
    const onSelect = jest.fn();
    render(<WhereWinnerBar onSelect={onSelect} selected={null} howEnded="ERRO_FORCADO" />);

    const devolvendoBtn = screen.getByRole('button', { name: 'Devolvendo' });
    expect(devolvendoBtn).toBeDisabled();

    const sacandoBtn = screen.getByRole('button', { name: 'Sacando' });
    expect(sacandoBtn).toBeEnabled();

    expect(screen.getByRole('button', { name: 'Fundo de quadra' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Voleando (na rede)' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Passando o jogador da rede' })).toBeEnabled();

    fireEvent.click(sacandoBtn);
    expect(onSelect).toHaveBeenCalledWith('sacando');
  });

  it('quando howEnded é ERRO_NAO_FORCADO: exibe 5 botões com Devolvendo desabilitado e Sacando habilitado', () => {
    const onSelect = jest.fn();
    render(<WhereWinnerBar onSelect={onSelect} selected={null} howEnded="ERRO_NAO_FORCADO" />);

    expect(screen.getByRole('button', { name: 'Devolvendo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sacando' })).toBeEnabled();
  });
});
