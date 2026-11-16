/**
 * @jest-environment jsdom
 */
// Divisão de EditScoreModal.matchFinish.test.tsx (387L/9 its) — Teste 4: Fluxo completo.
// Kit compartilhado: editScoreModalMatchFinishTestKit.tsx.
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderMatchFinishModal, SET1_LOST_2_6 } from './editScoreModalMatchFinishTestKit';

// Mock do useRouter do Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('EditScoreModal - Detecção de Partida Encerrada', () => {
  describe('Teste 4: Fluxo completo com redirecionamento', () => {
    it('deve executar fluxo completo: editar -> confirmar -> chamar callback', async () => {
      const onMatchFinishedMock = jest.fn();
      const onConfirmMock = jest.fn();

      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3',
        completedSets: SET1_LOST_2_6,
        onConfirm: onConfirmMock,
        onMatchFinished: onMatchFinishedMock,
      });

      // Digita Set 2: 4-6
      const inputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(inputs[0], { target: { value: '4' } });
      fireEvent.change(inputs[1], { target: { value: '6' } });

      // Aguarda banner
      await waitFor(() => {
        expect(screen.queryAllByText(/partida encerrada/i).length).toBeGreaterThan(0);
      });

      // Confirma
      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);

      // Verifica callbacks
      expect(onConfirmMock).toHaveBeenCalled();
      await waitFor(() => {
        expect(onMatchFinishedMock).toHaveBeenCalledWith('player2');
      });
    });
  });
});
