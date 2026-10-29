/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FloatingSpectatorProvider, useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';
import { FloatingSpectatorHost } from '../FloatingSpectatorHost';

const mockRefresh = jest.fn();

jest.mock('@/hooks/useSpectatorFeed', () => ({
  useSpectatorFeed: () => ({
    view: {
      match: { sides: [{ label: 'Ana' }, { label: 'Bia' }] },
      score: { sets: [{ player1: 6, player2: 4 }], currentGame: { player1: '40', player2: '30' } },
    },
    status: 'LIVE', lastUpdated: new Date(), isClientOffline: false,
    isRevoked: false, isNotFound: false, isRefreshing: false, refresh: () => mockRefresh(),
  }),
}));
jest.mock('@/app/matches/acompanhar/[matchId]/SpectatorLiveContent', () => ({
  SpectatorLiveContent: () => require('react').createElement('div', null, 'conteudo-ao-vivo'),
}));

function Opener() {
  const ctx = useFloatingSpectatorOptional()!;
  return (
    <>
      {['m1', 'm2', 'm3', 'm4'].map((id) => (
        <button key={id} onClick={() => ctx.open(id, `Partida ${id}`)}>abrir-{id}</button>
      ))}
    </>
  );
}

const setup = () => render(
  <FloatingSpectatorProvider><Opener /><FloatingSpectatorHost /></FloatingSpectatorProvider>,
);

describe('FloatingSpectatorHost', () => {
  it('abre a janela, minimiza em pílula com placar, expande e fecha', () => {
    setup();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByText('abrir-m1'));
    expect(screen.getByRole('dialog', { name: 'Acompanhamento: Ana × Bia' })).toBeInTheDocument();
    expect(screen.getByText('conteudo-ao-vivo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Minimizar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('6-4 40-30')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Expandir acompanhamento/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('botão Atualizar dispara refresh manual', () => {
    setup();
    fireEvent.click(screen.getByText('abrir-m1'));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('mostra aviso ao tentar abrir a 4ª partida', () => {
    setup();
    ['m1', 'm2', 'm3', 'm4'].forEach((id) => fireEvent.click(screen.getByText(`abrir-${id}`)));
    expect(screen.getByRole('status')).toHaveTextContent('Limite de 3 partidas');
  });
});
