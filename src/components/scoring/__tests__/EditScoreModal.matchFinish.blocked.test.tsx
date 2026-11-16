/**
 * @jest-environment jsdom
 */
// Divisão de EditScoreModal.matchFinish.test.tsx (387L/9 it) — Teste 3: Bloqueio de segurança.
// Kit compartilhado: editScoreModalMatchFinishTestKit.tsx.
import { screen } from '@testing-library/react';
import { renderMatchFinishModal, LOST_0_2 } from './editScoreModalMatchFinishTestKit';

// Mock do useRouter do Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('EditScoreModal - Detecção de Partida Encerrada', () => {
  describe('Teste 3: Bloqueio de segurança - Partida já encerrada', () => {
    it('deve mostrar mensagem se tentar adicionar set após partida encerrada', () => {
      renderMatchFinishModal({
        matchFormat: 'BEST_OF_3',
        completedSets: LOST_0_2,
      });

      // Quando partida já está encerrada, modal abre mas não permite adicionar novos sets
      // O campo de input do set 4 não é mostrado porque totalEditedSets >= maxSets
      expect(screen.queryAllByPlaceholderText('0')).toHaveLength(0);
    });
  });
});
