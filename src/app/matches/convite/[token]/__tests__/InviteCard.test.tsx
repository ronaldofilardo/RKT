/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InviteCard } from '../InviteCard';

describe('InviteCard', () => {
  const preview = {
    inviterName: 'Marcos',
    matchTitle: 'Ana S. × Bia L.',
    courtAndSet: 'Quadra 2 · 2º set',
    status: 'Ao vivo',
    matchId: 'm1',
  };

  it('renders all elements from wireframe', () => {
    render(<InviteCard preview={preview} redeeming={false} onRedeem={jest.fn()} />);

    expect(screen.getByText('Convite para acompanhar')).toBeInTheDocument();
    expect(screen.getByText('Marcos convidou você para ver esta partida.')).toBeInTheDocument();
    expect(screen.getByText('Ana S. × Bia L.')).toBeInTheDocument();
    expect(screen.getByText('Quadra 2 · 2º set')).toBeInTheDocument();
    expect(screen.getByText('Ao vivo')).toBeInTheDocument();
    expect(
      screen.getByText('Você vê placar e pontos em tempo real. Não dá para editar nada.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acompanhar partida' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agora não' })).toBeInTheDocument();
  });

  it('handles button click when redeeming', () => {
    const handleRedeem = jest.fn();
    render(<InviteCard preview={preview} redeeming={false} onRedeem={handleRedeem} />);

    fireEvent.click(screen.getByRole('button', { name: 'Acompanhar partida' }));
    expect(handleRedeem).toHaveBeenCalledTimes(1);
  });
});

