/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PointDetailsModal } from '../PointDetailsModal';

describe('PointDetailsModal - Doubles Features', () => {
  const p1 = { id: 'p1-id', name: 'Silva' };
  const p1Partner = { id: 'p1p-id', name: 'Santos' };
  const p2 = { id: 'p2-id', name: 'Oliveira' };
  const p2Partner = { id: 'p2p-id', name: 'Costa' };

  it('exibe seção "Quem fez o Winner?" em duplas quando o tipo selecionado for winner', () => {
    const onConfirmMock = jest.fn();

    render(
      <PointDetailsModal
        winnerPlayerSide="player1"
        currentServer="player1"
        player1Name={p1.name}
        player2Name={p2.name}
        fontScale={1}
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
        doubles={{
          player1: p1,
          player1Partner: p1Partner,
          player2: p2,
          player2Partner: p2Partner,
          activeServerId: 'p1-id',
          activeReceiverId: 'p2-id',
          isDecidingPoint: false,
        }}
      />
    );

    // Seleciona Situação: Fundo de Quadra
    fireEvent.click(screen.getByText('Fundo de Quadra'));

    // Seleciona Resultado: Winner
    fireEvent.click(screen.getByText('Winner'));

    // A seção "Quem fez o Winner?" deve aparecer com os membros da equipe vencedora (Silva e Santos)
    expect(screen.getByText('Quem fez o Winner?')).toBeInTheDocument();
    expect(screen.getByText('Silva')).toBeInTheDocument();
    expect(screen.getByText('Santos')).toBeInTheDocument();

    // Seleciona Santos como autor do golpe
    fireEvent.click(screen.getByText('Santos'));

    // Seleciona Golpe: Forehand
    fireEvent.click(screen.getByText(/Forehand/i));

    // Confirma o ponto
    const confirmBtn = screen.getByText('Confirmar Ponto');
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const passedDetails = onConfirmMock.mock.calls[0][0];
    expect(passedDetails.hitterId).toBe('p1p-id');
  });

  it('exibe seção "Lado de Devolução (Ponto Decisivo)" em deuce no-ad', () => {
    const onConfirmMock = jest.fn();

    render(
      <PointDetailsModal
        winnerPlayerSide="player2"
        currentServer="player1"
        player1Name={p1.name}
        player2Name={p2.name}
        fontScale={1}
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
        doubles={{
          player1: p1,
          player1Partner: p1Partner,
          player2: p2,
          player2Partner: p2Partner,
          activeServerId: 'p1-id',
          activeReceiverId: 'p2-id',
          isDecidingPoint: true,
        }}
      />
    );

    // Deve exibir o seletor do ponto decisivo com os recebedores (Oliveira e Costa)
    expect(screen.getByText(/Lado de Devolução \(Ponto Decisivo\)/)).toBeInTheDocument();
    expect(screen.getByText('Oliveira')).toBeInTheDocument();
    expect(screen.getByText('Costa')).toBeInTheDocument();

    // Seleciona Costa para receber no ponto decisivo
    fireEvent.click(screen.getByText('Costa'));

    // Seleciona Situação: Devolução
    fireEvent.click(screen.getByText('Devolução de Saque'));
    // Seleciona Resultado: Winner
    fireEvent.click(screen.getByText('Winner'));
    // Seleciona Golpe: Forehand
    fireEvent.click(screen.getByText(/Forehand/i));

    // Confirma
    const confirmBtn = screen.getByText('Confirmar Ponto');
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const passedDetails = onConfirmMock.mock.calls[0][0];
    expect(passedDetails.receiverId).toBe('p2p-id');
  });
});
