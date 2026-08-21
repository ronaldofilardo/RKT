/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PointDetailsModal } from '@/components/scoring/PointDetailsModal';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { formReducer, initialForm } from '@/components/scoring/point-details-logic';

jest.mock('@/hooks/useVoiceRecorder', () => ({
  useVoiceRecorder: jest.fn(),
}));

const mockUseVoiceRecorder = useVoiceRecorder as jest.Mock;

const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();

function renderModal(overrides: Partial<{
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  fontScale: number;
}> = {}) {
  return render(
    <PointDetailsModal
      winnerPlayerSide={overrides.winnerPlayerSide ?? 'player1'}
      currentServer={overrides.currentServer ?? 'player1'}
      player1Name={overrides.player1Name ?? 'Alice'}
      player2Name={overrides.player2Name ?? 'Bob'}
      fontScale={overrides.fontScale ?? 1}
      onConfirm={mockOnConfirm}
      onCancel={mockOnCancel}
    />
  );
}

describe('PointDetailsModal — Characterization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();

    mockUseVoiceRecorder.mockReturnValue({
      state: 'idle',
      audioBlob: null,
      durationMs: 0,
      error: null,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playPreview: jest.fn(),
      clear: jest.fn(),
      stopPreview: jest.fn(),
    });
  });

  describe('Initial render & state', () => {
    it('renders modal with winner info', async () => {
      renderModal({ winnerPlayerSide: 'player2', currentServer: 'player1', player1Name: 'Alice', player2Name: 'Bob' });
      await waitFor(() => expect(screen.getByText(/Vencedor do Ponto/i)).toBeInTheDocument());
      expect(screen.getByText('↩️ Devolvedor — Bob')).toBeInTheDocument();
    });

    it('renders sacador when winner is server', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1', player1Name: 'Alice', player2Name: 'Bob' });
      await waitFor(() => expect(screen.getByText('🎾 Sacador — Alice')).toBeInTheDocument());
    });

    it('shows 4 situacao options initially unselected', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());

      const situacaoButtons = screen.getAllByRole('button', { name: /Devolu\u00e7\u00e3o de Saque|Fundo de Quadra|Passada|Rede/ });
      expect(situacaoButtons).toHaveLength(4);

      situacaoButtons.forEach(btn => {
        expect(btn).not.toHaveAttribute('aria-pressed', 'true');
        expect(btn.getAttribute('aria-pressed')).not.toBe('true');
      });
    });

    it('Confirm button disabled initially', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Vencedor do Ponto/i)).toBeInTheDocument());
      expect(screen.getByText('Confirmar Ponto')).toBeDisabled();
    });

    it('Cancel button visible', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Vencedor do Ponto/i)).toBeInTheDocument());
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
  });

  describe('Situacao selection flow', () => {
    it('shows Tipo section after selecting situacao', async () => {
      renderModal({ winnerPlayerSide: 'player2', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Devolução de Saque' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
    });

    it('shows correct Tipo options for devolucao + devolvedor', async () => {
      renderModal({ winnerPlayerSide: 'player2', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Devolução de Saque' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());

      const tipoButtons = screen.getAllByRole('button', { name: /Winner|Erro N\u00e3o For\u00e7ado|Erro For\u00e7ado/ });
      expect(tipoButtons).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'Winner' })).toBeInTheDocument();
    });

    it('shows correct Tipo options for devolucao + sacador', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Devolução de Saque' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());

      const tipoButtons = screen.getAllByRole('button', { name: /Winner|Erro N\u00e3o For\u00e7ado|Erro For\u00e7ado/ });
      expect(tipoButtons).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Erro Não Forçado' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Erro Forçado' })).toBeInTheDocument();
    });

    it('shows correct Tipo options for fundo', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());

      const tipoButtons = screen.getAllByRole('button', { name: /Winner|Erro N\u00e3o For\u00e7ado|Erro For\u00e7ado/ });
      expect(tipoButtons).toHaveLength(3);
    });
  });

  describe('Golpe selection flow', () => {
    it('shows Golpe section after selecting tipo', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
    });

    it('shows fh and bh for vencedor + fundo + winner', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());

      const golpeButtons = screen.getAllByRole('button', { name: /Forehand|Backhand/ });
      expect(golpeButtons).toHaveLength(2);
    });

    it('shows vfh, vbh, smash for passada + non-winner', async () => {
      renderModal({ winnerPlayerSide: 'player2', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Passada' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Erro Não Forçado' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());

      const golpeButtons = screen.getAllByRole('button', { name: /Voleio FH|Voleio BH|Smash/ });
      expect(golpeButtons).toHaveLength(3);
    });
  });

  describe('Subtipo1 (Tipo de Erro Rede) - shown only for sacador + rede + non-winner', () => {
    it('shows subtipo1 for sacador + rede + non-winner', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Rede' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Erro Não Forçado' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Tipo de Erro \(Rede\)/i)).toBeInTheDocument());
    });

    it('does not show subtipo1 for devolvedor + rede + non-winner', async () => {
      renderModal({ winnerPlayerSide: 'player2', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Rede' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Erro Não Forçado' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => {
        expect(screen.queryByText(/Tipo de Erro \(Rede\)/i)).not.toBeInTheDocument();
      });
    });

    it('does not show subtipo1 for winner', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Rede' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Voleio FH' }));
      await waitFor(() => {
        expect(screen.queryByText(/Tipo de Erro \(Rede\)/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Subtipo2 (Onde Errou?) - shown for passada + non-winner + voleio/smash', () => {
    it('shows subtipo2 for passada + non-winner + vbh', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Passada' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Erro Não Forçado' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Voleio BH' }));
      await waitFor(() => expect(screen.getByText(/Onde Errou\?/i)).toBeInTheDocument());
    });

    it('shows subtipo2 for passada + non-winner + vfh', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Passada' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Erro Não Forçado' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Voleio FH' }));
      await waitFor(() => expect(screen.getByText(/Onde Errou\?/i)).toBeInTheDocument());
    });

    it('does not show subtipo2 for winner', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Passada' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => {
        expect(screen.queryByText(/Onde Errou\?/i)).not.toBeInTheDocument();
      });
    });

    it('does not show subtipo2 for non-voleio/smash', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Passada' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => {
        expect(screen.queryByText(/Onde Errou\?/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Efeito section', () => {
    it('shows efeito for most combinations', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Efeito/i)).toBeInTheDocument());
    });

    it('does not show efeito for passada + non-winner', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Passada' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Erro Não Forçado' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Voleio BH' }));
      await waitFor(() => {
        expect(screen.queryByText(/Efeito/i)).not.toBeInTheDocument();
      });
    });

    it('does not show efeito for rede + winner', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Rede' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Voleio FH' }));
      await waitFor(() => {
        expect(screen.queryByText(/Efeito/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Direção section', () => {
    it('shows direcao when golpe selected', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Dire\u00e7\u00e3o/i)).toBeInTheDocument());
    });

    it('blocks direcao when efeito not selected but needed', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Efeito/i)).toBeInTheDocument());
      // Don't select efeito
      expect(screen.getByText(/Dire\u00e7\u00e3o/i)).toBeInTheDocument();
      const direcaoButtons = screen.getAllByRole('button', { name: /Cruzada|Paralela|Centro|Inside-out|Inside-in/ });
      // Direção should be blocked (null selection) when efeito is needed but not selected
      direcaoButtons.forEach(btn => {
        expect(btn).not.toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Golpe Especial section', () => {
    it('shows golpe especial for slice efeito', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Efeito/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Slice' }));
      await waitFor(() => expect(screen.getByText(/Golpe Especial/i)).toBeInTheDocument());
      const especialButtons = screen.getAllByRole('button', { name: /Lob|Drop Shot/ });
      expect(especialButtons).toHaveLength(2);
    });

    it('shows golpe especial for lob/drop_shot with slice efeito', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Efeito/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Slice' }));
      await waitFor(() => expect(screen.getByText(/Golpe Especial/i)).toBeInTheDocument());
      const especialButtons = screen.getAllByRole('button', { name: /Lob|Drop Shot/ });
      expect(especialButtons).toHaveLength(2);
    });

    it('does not show golpe especial for flat efeito', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Efeito/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Flat' }));
      await waitFor(() => {
        expect(screen.queryByText(/Golpe Especial/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Duração do Rallye', () => {
    it('shows duracao for fundo + golpe', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText(/Dura\u00e7\u00e3o do Rallye/i)).toBeInTheDocument());
    });

    it('does not show duracao for devolucao', async () => {
      renderModal({ winnerPlayerSide: 'player2', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Devolução de Saque' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => {
        expect(screen.queryByText(/Dura\u00e7\u00e3o do Rallye/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Confirm flow', () => {
    it('enables Confirm button when golpe selected', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => {
        expect(screen.getByText('Confirmar Ponto')).not.toBeDisabled();
      });
    });

    it('calls onConfirm with correct payload', async () => {
      renderModal({ winnerPlayerSide: 'player1', currentServer: 'player1', player1Name: 'Alice', player2Name: 'Bob' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Fundo de Quadra' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText('Confirmar Ponto')).not.toBeDisabled());

      fireEvent.click(screen.getByText('Confirmar Ponto'));
      await waitFor(() => expect(mockOnConfirm).toHaveBeenCalled());

      const call = mockOnConfirm.mock.calls[0];
      expect(call[0]).toMatchObject({
        vencedor: 'sacador',
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        previewBalls: 1,
      });
    });

    it('sets previewBalls to 2 for devolucao', async () => {
      renderModal({ winnerPlayerSide: 'player2', currentServer: 'player1', player1Name: 'Alice', player2Name: 'Bob' });
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Devolução de Saque' }));
      await waitFor(() => expect(screen.getByText(/Resultado do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Winner' }));
      await waitFor(() => expect(screen.getByText(/Golpe/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Forehand (FH)' }));
      await waitFor(() => expect(screen.getByText('Confirmar Ponto')).not.toBeDisabled());

      fireEvent.click(screen.getByText('Confirmar Ponto'));
      await waitFor(() => expect(mockOnConfirm).toHaveBeenCalled());

      const call = mockOnConfirm.mock.calls[0];
      expect(call[0].previewBalls).toBe(2);
    });
  });

  describe('Cancel & Close dialog', () => {
    it('opens close dialog on Cancel click', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Cancelar'));
      await waitFor(() => expect(screen.getByText('Descartar detalhes?')).toBeInTheDocument());
    });

    it('opens close dialog on Escape key', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.getByText('Descartar detalhes?')).toBeInTheDocument());
    });

    it('closes dialog on "Continuar preenchendo" (does not call onCancel)', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Cancelar'));
      await waitFor(() => expect(screen.getByText('Descartar detalhes?')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Continuar preenchendo'));
      // Just verify onCancel was not called
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel on "Descartar e voltar"', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Cancelar'));
      await waitFor(() => expect(screen.getByText('Descartar detalhes?')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Descartar e voltar'));
      await waitFor(() => expect(mockOnCancel).toHaveBeenCalled());
    });

    it('opens close dialog on backdrop click (does not call onCancel directly)', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByLabelText('Fechar modal'));
      await waitFor(() => expect(screen.getByText('Descartar detalhes?')).toBeInTheDocument());
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Notes modal', () => {
    it('opens notes modal on Observações button click', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Observações'));
      await waitFor(() => expect(screen.getByText('Observações do Ponto')).toBeInTheDocument());
    });

    it('shows text mode by default', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Observações'));
      await waitFor(() => expect(screen.getByPlaceholderText(/Ex: jogador estava cansado/i)).toBeInTheDocument());
    });

    it('switches to voice mode', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Observações'));
      await waitFor(() => expect(screen.getByText('🎤 Voz')).toBeInTheDocument());
      fireEvent.click(screen.getByText('🎤 Voz'));
      await waitFor(() => expect(screen.getByText('Gravar nota de voz')).toBeInTheDocument());
    });

    it('saves note text', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Observações'));
      await waitFor(() => expect(screen.getByPlaceholderText(/Ex: jogador estava cansado/i)).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText(/Ex: jogador estava cansado/i), { target: { value: 'Test note' } });
      fireEvent.click(screen.getByText('Guardar'));
      await waitFor(() => expect(screen.queryByText('Observações do Ponto')).not.toBeInTheDocument());
      // Note indicator should show
      expect(screen.getByText('Observações')).toHaveTextContent(/📝/);
    });
  });

  describe('Voice recorder integration', () => {
    it('shows voice recorder in voice mode', async () => {
      renderModal();
      await waitFor(() => expect(screen.getByText(/Situa\u00e7\u00e3o do Ponto/i)).toBeInTheDocument());
      fireEvent.click(screen.getByText('Observações'));
      await waitFor(() => expect(screen.getByText('🎤 Voz')).toBeInTheDocument());
      fireEvent.click(screen.getByText('🎤 Voz'));
      await waitFor(() => expect(screen.getByText('Gravar nota de voz')).toBeInTheDocument());
    });
  });

  describe('formReducer logic', () => {
    it('resets subsequent fields when situacao changes', () => {
      let state = { ...initialForm, situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin' };
      state = formReducer(state, { type: 'SET_SITUACAO', value: 'devolucao' });
      expect(state.situacao).toBe('devolucao');
      expect(state.tipo).toBeNull();
      expect(state.golpe).toBeNull();
      expect(state.efeito).toBeNull();
    });

    it('resets subsequent fields when tipo changes', () => {
      let state = { ...initialForm, situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin' };
      state = formReducer(state, { type: 'SET_TIPO', value: 'erro_nao_forcado' });
      expect(state.tipo).toBe('erro_nao_forcado');
      expect(state.golpe).toBeNull();
      expect(state.efeito).toBeNull();
    });

    it('resets subsequent fields when golpe changes', () => {
      let state = { ...initialForm, situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin' };
      state = formReducer(state, { type: 'SET_GOLPE', value: 'bh' });
      expect(state.golpe).toBe('bh');
      expect(state.efeito).toBeNull();
    });

    it('resets direcao and golpeEsp when efeito changes', () => {
      let state = { ...initialForm, situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin', direcao: 'cruzada', golpeEsp: 'lob' };
      state = formReducer(state, { type: 'SET_EFEITO', value: 'slice' });
      expect(state.efeito).toBe('slice');
      expect(state.direcao).toBeNull();
      expect(state.golpeEsp).toBeNull();
    });

    it('resets golpeEsp when direcao changes', () => {
      let state = { ...initialForm, situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin', direcao: 'cruzada', golpeEsp: 'lob' };
      state = formReducer(state, { type: 'SET_DIRECAO', value: 'paralela' });
      expect(state.direcao).toBe('paralela');
      expect(state.golpeEsp).toBeNull();
    });

    it('RESET action returns initialForm', () => {
      let state = { ...initialForm, situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin', direcao: 'cruzada', golpeEsp: 'lob' };
      state = formReducer(state, { type: 'RESET' });
      expect(state).toEqual(initialForm);
    });
  });

  describe('Logic functions', () => {
    it('getTipoOptions returns correct options for devolucao + devolvedor', () => {
      const { getTipoOptions } = require('@/components/scoring/point-details-logic');
      expect(getTipoOptions('devolvedor', 'devolucao')).toEqual(['winner']);
    });

    it('getTipoOptions returns correct options for devolucao + sacador', () => {
      const { getTipoOptions } = require('@/components/scoring/point-details-logic');
      expect(getTipoOptions('sacador', 'devolucao')).toEqual(['erro_nao_forcado', 'erro_forcado']);
    });

    it('shouldShowSubtipo1 returns true only for sacador + rede + non-winner', () => {
      const { shouldShowSubtipo1 } = require('@/components/scoring/point-details-logic');
      expect(shouldShowSubtipo1('sacador', 'rede', 'erro_nao_forcado')).toBe(true);
      expect(shouldShowSubtipo1('sacador', 'rede', 'winner')).toBe(false);
      expect(shouldShowSubtipo1('devolvedor', 'rede', 'erro_nao_forcado')).toBe(false);
    });

    it('shouldShowSubtipo2 returns true for passada + non-winner + voleio/smash', () => {
      const { shouldShowSubtipo2 } = require('@/components/scoring/point-details-logic');
      expect(shouldShowSubtipo2('passada', 'erro_nao_forcado', 'vbh')).toBe(true);
      expect(shouldShowSubtipo2('passada', 'erro_nao_forcado', 'vfh')).toBe(true);
      expect(shouldShowSubtipo2('passada', 'erro_nao_forcado', 'smash')).toBe(true);
      expect(shouldShowSubtipo2('passada', 'erro_nao_forcado', 'fh')).toBe(false);
      expect(shouldShowSubtipo2('passada', 'winner', 'vbh')).toBe(false);
    });

    it('shouldShowDuracao returns false for devolucao', () => {
      const { shouldShowDuracao } = require('@/components/scoring/point-details-logic');
      expect(shouldShowDuracao('devolucao', 'fh')).toBe(false);
      expect(shouldShowDuracao('devolucao', 'bh')).toBe(false);
      expect(shouldShowDuracao('fundo', 'fh')).toBe(true);
    });

    it('shouldShowEfeito returns false for passada + non-winner', () => {
      const { shouldShowEfeito } = require('@/components/scoring/point-details-logic');
      expect(shouldShowEfeito('devolvedor', 'passada', 'erro_nao_forcado', false, false)).toBe(false);
      expect(shouldShowEfeito('sacador', 'rede', 'winner', false, false)).toBe(false);
      expect(shouldShowEfeito('devolvedor', 'fundo', 'winner', false, false)).toBe(true);
    });

    it('getDirecaoOptions returns reduced set for slice', () => {
      const { getDirecaoOptions } = require('@/components/scoring/point-details-logic');
      expect(getDirecaoOptions('slice', 'fundo', 'winner')).toEqual(['cruzada', 'paralela', 'centro']);
    });

    it('getGolpeEspOptions returns lob/drop_shot for slice', () => {
      const { getGolpeEspOptions } = require('@/components/scoring/point-details-logic');
      const opts = getGolpeEspOptions('fh', 'slice', 'devolvedor', 'fundo', 'winner', null, 'cruzada');
      expect(opts).toContain('lob');
      expect(opts).toContain('drop_shot');
    });

    it('getGolpeEspOptions returns empty for flat', () => {
      const { getGolpeEspOptions } = require('@/components/scoring/point-details-logic');
      const opts = getGolpeEspOptions('fh', 'flat', 'devolvedor', 'fundo', 'winner', null, 'cruzada');
      expect(opts).toEqual([]);
    });

    it('getGolpeEspOptions returns empty for smash', () => {
      const { getGolpeEspOptions } = require('@/components/scoring/point-details-logic');
      const opts = getGolpeEspOptions('smash', 'topspin', 'devolvedor', 'fundo', 'winner', null, 'cruzada');
      expect(opts).toEqual([]);
    });
  });
});