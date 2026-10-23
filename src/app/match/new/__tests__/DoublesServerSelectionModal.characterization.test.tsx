/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) pré-B-5: DoublesServerSelectionModal (261L →
 * seções/children em B-5a/B-5b). A caracterização existente
 * `DashboardMatchModals.doubles` cobre render+confirm; esta congela os
 * cliques das 3 seções de JSX que serão extraídos (serving side,
 * first servers, receive deuce) observados via buildConfirmation().
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DoublesServerSelectionModal } from '../components/DoublesServerSelectionModal';
import type { DoublesSetup } from '@/schemas/contracts';

function renderModal(onConfirmDoublesSetup = jest.fn()) {
  render(
    <DoublesServerSelectionModal
      isOpen
      selectedP1={{ id: 'p1', name: 'Rafael Nadal' }}
      selectedP1Partner={{ id: 'p1p', name: 'Carlos Alcaraz' }}
      selectedP2={{ id: 'p2', name: 'Roger Federer' }}
      selectedP2Partner={{ id: 'p2p', name: 'Novak Djokovic' }}
      startingMatch={false}
      onConfirmDoublesSetup={onConfirmDoublesSetup}
      onClose={jest.fn()}
    />
  );
  return { onConfirmDoublesSetup };
}

function confirmAndGet(onConfirmDoublesSetup: jest.Mock) {
  fireEvent.click(screen.getByRole('button', { name: /Confirmar e Iniciar Partida/i }));
  expect(onConfirmDoublesSetup).toHaveBeenCalledTimes(1);
  const [initialServerId, setup] = onConfirmDoublesSetup.mock.calls[0] as [
    string,
    DoublesSetup,
  ];
  return { initialServerId, setup };
}

describe('DoublesServerSelectionModal — characterization das seções (pré-extração B-5)', () => {
  it('Seção 1: clicar "Dupla 2" define initialServerId do lado player2 ao confirmar', () => {
    const { onConfirmDoublesSetup } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: /Dupla 2 Roger/ }));

    const { initialServerId } = confirmAndGet(onConfirmDoublesSetup);
    expect(initialServerId).toBe('p2');
  });

  it('Seção 1 (default): sem clique, initialServerId vem da Dupla 1', () => {
    const { onConfirmDoublesSetup } = renderModal();

    const { initialServerId } = confirmAndGet(onConfirmDoublesSetup);
    expect(initialServerId).toBe('p1');
  });

  it('Seção 2: clicar nos partners define o 1º sacador de cada dupla (serveOrder invertido)', () => {
    const { onConfirmDoublesSetup } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: '1º: Carlos Alcaraz' }));
    fireEvent.click(screen.getByRole('button', { name: '1º: Novak Djokovic' }));

    const { setup } = confirmAndGet(onConfirmDoublesSetup);
    expect(setup.serveOrder.player1).toEqual(['p1p', 'p1']);
    expect(setup.serveOrder.player2).toEqual(['p2p', 'p2']);
  });

  it('Seção 2 (default): sem clique, 1º sacador de cada dupla é o próprio p1/p2', () => {
    const { onConfirmDoublesSetup } = renderModal();

    const { setup } = confirmAndGet(onConfirmDoublesSetup);
    expect(setup.serveOrder.player1).toEqual(['p1', 'p1p']);
    expect(setup.serveOrder.player2).toEqual(['p2', 'p2p']);
  });

  it('Seção 3: clicar nos partners define receiveDeuce de cada dupla', () => {
    const { onConfirmDoublesSetup } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Deuce: Carlos Alcaraz' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deuce: Novak Djokovic' }));

    const { setup } = confirmAndGet(onConfirmDoublesSetup);
    expect(setup.receiveDeuce.player1).toBe('p1p');
    expect(setup.receiveDeuce.player2).toBe('p2p');
  });

  it('Seção 3 (default): sem clique, receiveDeuce de cada dupla é o próprio p1/p2', () => {
    const { onConfirmDoublesSetup } = renderModal();

    const { setup } = confirmAndGet(onConfirmDoublesSetup);
    expect(setup.receiveDeuce.player1).toBe('p1');
    expect(setup.receiveDeuce.player2).toBe('p2');
  });
});
