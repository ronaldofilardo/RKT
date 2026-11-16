/**
 * @jest-environment jsdom
 */
// Divisão de EditScoreModal.matchFinish.test.tsx (387L/9 its) — Teste 5: Bug 6-5 no 3º set.
// Kit compartilhado: editScoreModalMatchFinishTestKit.tsx.
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderMatchFinishModal, TIED_1_1_THIRD } from './editScoreModalMatchFinishTestKit';

// Mock do useRouter do Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('EditScoreModal - Detecção de Partida Encerrada', () => {
  describe('Teste 5: Bug 6-5 no 3º set - NÃO deve encerrar partida', () => {
    it("não deve mostrar 'Partida Encerrada' com placar 6-5 no 3º set (sets 1x1)", async () => {
      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3',
        completedSets: TIED_1_1_THIRD,
      });

      // Digita placar 6-5 no 3º set
      const inputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(inputs[0], { target: { value: '6' } });
      fireEvent.change(inputs[1], { target: { value: '5' } });

      // Verifica que NÃO mostra banner de partida encerrada
      await waitFor(() => {
        expect(screen.queryByText(/Partida encerrada — confirmar para finalizar/i)).not.toBeInTheDocument();
      });

      // Verifica que mostra mensagem de set em andamento
      expect(screen.getByText(/Set 3 em andamento — informe os games/i)).toBeInTheDocument();
    });

    it('deve mostrar Partida Encerrada apenas com placar 7-5 no 3º set (sets 1x1)', async () => {
      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3',
        completedSets: TIED_1_1_THIRD,
      });

      // Digita placar 7-5 no 3º set
      const inputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(inputs[0], { target: { value: '7' } });
      fireEvent.change(inputs[1], { target: { value: '5' } });

      // Verifica que mostra banner de partida encerrada
      await waitFor(() => {
        expect(screen.getByText(/Partida encerrada — confirmar para finalizar/i)).toBeInTheDocument();
      });
    });

    it('NÃO deve encerrar partida com placar 7-6 sem placar de tiebreak (games 7-6 só existem após o TB)', async () => {
      // 7-6 isolado não é um resultado completo: um game a 6-6 só existe
      // dentro do tiebreak, e o set só termina em 7-6 quando o placar do TB
      // foi registrado (PLANO_AJUSTAR_PLACAR, itens 1 e 2).
      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3',
        completedSets: TIED_1_1_THIRD,
      });

      // Digita placar 7-6 no 3º set (sem placar de tiebreak)
      const inputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(inputs[0], { target: { value: '7' } });
      fireEvent.change(inputs[1], { target: { value: '6' } });

      // Não deve mostrar banner de partida encerrada nem mensagem de vitória
      await waitFor(() => {
        expect(screen.queryByText(/Partida encerrada — confirmar para finalizar/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/venceu o set/i)).not.toBeInTheDocument();
      });
      // O set segue em andamento (para registrar 7-6 completo, o usuário
      // digita 6-6 → informa o placar do tiebreak → o sistema grava 7-6 + TB)
      expect(screen.getByText(/Set 3 em andamento/i)).toBeInTheDocument();
    });
  });
});
