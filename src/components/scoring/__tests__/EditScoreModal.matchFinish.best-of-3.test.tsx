/**
 * @jest-environment jsdom
 */
// Divisão de EditScoreModal.matchFinish.test.tsx (387L/9 its) — Teste 1: BEST_OF_3.
// Kit compartilhado: editScoreModalMatchFinishTestKit.tsx.
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderMatchFinishModal, SET1_LOST_1_6 } from './editScoreModalMatchFinishTestKit';

// Mock do useRouter do Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('EditScoreModal - Detecção de Partida Encerrada', () => {
  describe('Teste 1: BEST_OF_3 - Partida encerra com 2 sets', () => {
    it('deve detectar partida encerrada e chamar onMatchFinished', async () => {
      const onMatchFinishedMock = jest.fn();
      const onConfirmMock = jest.fn();

      // Simula Set 1 já completado (Play2 venceu 6-1)
      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3',
        completedSets: SET1_LOST_1_6,
        onConfirm: onConfirmMock,
        onMatchFinished: onMatchFinishedMock,
      });

      // Digita Set 2: 1-6 (Play2 vence novamente)
      const inputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(inputs[0], { target: { value: '1' } });
      fireEvent.change(inputs[1], { target: { value: '6' } });

      // Aguarda banner de partida encerrada aparecer
      await waitFor(() => {
        expect(screen.queryAllByText(/partida encerrada/i).length).toBeGreaterThan(0);
      });

      // Verifica que banner verde existe
      const banner = screen.getByText(/Partida encerrada — confirmar para finalizar/i);
      expect(banner).toBeInTheDocument();

      // Clica em Confirmar Placar
      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);

      // Verifica que onMatchFinished foi chamado com winner correto
      await waitFor(() => {
        expect(onMatchFinishedMock).toHaveBeenCalledWith('player2');
      });

      // Verifica que onConfirm também foi chamado
      expect(onConfirmMock).toHaveBeenCalled();
    });

    it('deve mostrar banner verde quando partida é encerrada', async () => {
      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3',
        completedSets: SET1_LOST_1_6,
      });

      // Digita Set 2: 6-3
      const inputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(inputs[0], { target: { value: '3' } });
      fireEvent.change(inputs[1], { target: { value: '6' } });

      // Verifica banner verde
      await waitFor(() => {
        const banner = screen.getByText(/Partida encerrada — confirmar para finalizar/i);
        expect(banner).toBeInTheDocument();
      });
    });
  });
});
