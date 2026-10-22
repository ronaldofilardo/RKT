/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoublesArrangementModal } from '../DoublesArrangementModal';
import type { DoublesArrangement } from '@/core/scoring/types';

describe('DoublesArrangementModal', () => {
  const p1 = { id: 'p1', name: 'Silva' };
  const p1Partner = { id: 'p1p', name: 'Santos' };
  const p2 = { id: 'p2', name: 'Oliveira' };
  const p2Partner = { id: 'p2p', name: 'Costa' };

  const currentArrangement: DoublesArrangement = {
    serveOrder: {
      player1: ['p1', 'p1p'],
      player2: ['p2', 'p2p'],
    },
    serveIndex: { player1: 0, player2: 0 },
    receiveDeuce: {
      player1: 'p1',
      player2: 'p2',
    },
  };

  it('não renderiza quando isOpen é false', () => {
    const { container } = render(
      <DoublesArrangementModal
        isOpen={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        player1={p1}
        player1Partner={p1Partner}
        player2={p2}
        player2Partner={p2Partner}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza corretamente com os 4 atletas e permite trocar sacadores e recebedores', async () => {
    const onConfirmMock = jest.fn();
    const onCloseMock = jest.fn();

    render(
      <DoublesArrangementModal
        isOpen={true}
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        player1={p1}
        player1Partner={p1Partner}
        player2={p2}
        player2Partner={p2Partner}
        currentArrangement={currentArrangement}
        currentSetIndex={1}
      />
    );

    expect(screen.getByText(/Formação das Duplas \(Set 2\)/)).toBeInTheDocument();
    expect(screen.getByText('Silva / Santos')).toBeInTheDocument();
    expect(screen.getByText('Oliveira / Costa')).toBeInTheDocument();

    // Seleciona Santos como primeiro sacador da Dupla 1
    const p1PartnerServerBtn = screen.getByText('🎾 Santos');
    fireEvent.click(p1PartnerServerBtn);

    // Seleciona Costa como primeiro sacador da Dupla 2
    const p2PartnerServerBtn = screen.getByText('🎾 Costa');
    fireEvent.click(p2PartnerServerBtn);

    // Clica em confirmar
    const confirmBtn = screen.getByText('Confirmar Formação');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    expect(onConfirmMock).toHaveBeenCalledWith({
      serveOrder: {
        player1: ['p1p', 'p1'],
        player2: ['p2p', 'p2'],
      },
      serveIndex: { player1: 0, player2: 0 },
      receiveDeuce: {
        player1: 'p1',
        player2: 'p2',
      },
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('reseta isSubmitting e não trava o botão em Salvando... se onConfirm falhar', async () => {
    const onConfirmMock = jest.fn().mockRejectedValue(new Error('Falha de rede'));
    const onCloseMock = jest.fn();

    render(
      <DoublesArrangementModal
        isOpen={true}
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        player1={p1}
        player1Partner={p1Partner}
        player2={p2}
        player2Partner={p2Partner}
        currentArrangement={currentArrangement}
        currentSetIndex={1}
      />
    );

    const confirmBtn = screen.getByText('Confirmar Formação');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Confirmar Formação')).not.toBeDisabled();
    });
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
