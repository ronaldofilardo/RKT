/**
 * @jest-environment jsdom
 */
// Divisão de EditScoreModal.matchFinish.test.tsx (387L/9 its) — Teste 2: Match Tiebreak.
// Kit compartilhado: editScoreModalMatchFinishTestKit.tsx.
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderMatchFinishModal, TIED_1_1_MT } from './editScoreModalMatchFinishTestKit';

// Mock do useRouter do Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('EditScoreModal - Detecção de Partida Encerrada', () => {
  describe('Teste 2: BEST_OF_3_MATCH_TB - Set 3 é Match Tiebreak', () => {
    it('deve detectar partida encerrada no match tiebreak', async () => {
      const onMatchFinishedMock = jest.fn();
      const onConfirmMock = jest.fn();

      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3_MATCH_TB',
        completedSets: TIED_1_1_MT,
        onConfirm: onConfirmMock,
        onMatchFinished: onMatchFinishedMock,
      });

      // Verifica que mostra UI de Match Tiebreak
      expect(screen.getByText(/Set 3 — Match Tiebreak/i)).toBeInTheDocument();

      // Digita placar do match tiebreak: 10-7
      const inputs = screen.getAllByPlaceholderText('0');
      fireEvent.change(inputs[0], { target: { value: '10' } });
      fireEvent.change(inputs[1], { target: { value: '7' } });

      // Aguarda mensagem de partida encerrada
      await waitFor(() => {
        expect(screen.queryAllByText(/venceu o match tiebreak — partida encerrada/i).length).toBeGreaterThan(0);
      });

      // Clica em Confirmar
      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);

      // Verifica callback
      await waitFor(() => {
        expect(onMatchFinishedMock).toHaveBeenCalledWith('player1');
      });
    });

    it('deve alertar match tiebreak incompleto (9-8 diferença < 2)', async () => {
      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3_MATCH_TB',
        completedSets: TIED_1_1_MT,
      });

      const inputs = screen.getAllByPlaceholderText('0');

      // Digita placar incompleto: 9-8 (diferença < 2)
      fireEvent.change(inputs[0], { target: { value: '9' } });
      fireEvent.change(inputs[1], { target: { value: '8' } });

      // Verifica que a mensagem explicativa de regra NÃO aparece mais (bug #6).
      // Em MT não-completo, nenhum texto descrevendo a regra de "diferença
      // de 2 pontos necessária" deve ser oferecido — só silêncio.
      expect(screen.queryByText(/Match tiebreak em andamento/i)).toBeNull();
      expect(screen.queryByText(/diferença de 2 pontos/i)).toBeNull();

      // Botão Confirmar permanece habilitado para permitir salvamento de estado parcial
      const confirmButton = screen.getByText('Confirmar');
      expect(confirmButton).not.toBeDisabled();

      // Em modo MT não-completo, o status é silencioso (sem "em andamento").
      expect(screen.queryByText(/em andamento/i)).toBeNull();
    });
  });
});
