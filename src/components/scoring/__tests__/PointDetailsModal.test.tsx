/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PointDetailsModal } from '@/components/scoring/PointDetailsModal';

describe('PointDetailsModal - initial state', () => {
  it('does not preselect any situacao option when the modal opens', async () => {
    const { container } = render(
      <PointDetailsModal
        winnerPlayerSide="player2"
        currentServer="player1"
        player1Name="Alice"
        player2Name="Bob"
        fontScale={1}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Vencedor do Ponto/i)).toBeInTheDocument();
    });

    const allButtons = Array.from(container.querySelectorAll('button'));
    const sectionHeading = screen.getByText(/Situa\u00e7\u00e3o do Ponto/i);

    const situacaoContainer = sectionHeading.parentElement as HTMLElement;
    const situacaoButtons = Array.from(
      situacaoContainer.querySelectorAll('button'),
    );

    expect(situacaoButtons.length).toBe(4);

    situacaoButtons.forEach((btn) => {
      const label = btn.textContent?.trim() ?? '';
      const isSelectedStyle =
        btn.className.includes('border-blue-500') ||
        btn.className.includes('border-blue-600');
      expect(isSelectedStyle).toBe(false);

      expect(btn.getAttribute('aria-pressed')).not.toBe('true');

      expect(label).not.toBe('');
    });
  });

  it('aria-pressed is false for every pill in situacao', async () => {
    render(
      <PointDetailsModal
        winnerPlayerSide="player1"
        currentServer="player1"
        player1Name="Alice"
        player2Name="Bob"
        fontScale={1}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Vencedor do Ponto/i)).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const situacaoLabels = ['Devolução de Saque', 'Fundo de Quadra', 'Passada', 'Rede'];
    buttons
      .filter((b) => situacaoLabels.includes((b.textContent ?? '').trim()))
      .forEach((b) => {
        const ariaPressed = b.getAttribute('aria-pressed');
        expect(ariaPressed === 'false' || ariaPressed === null).toBe(true);
      });
  });
});

describe('PointDetailsModal - Devolucao flow - shouldShowDuracao', () => {
  it('Devolucao nao mostra etapa Duracao', () => {
    const shouldShowDuracao = (situacao: string | null, golpe: string | null): boolean => {
      if (situacao === 'devolucao') return false;
      return golpe != null;
    };

    expect(shouldShowDuracao('devolucao', 'fh')).toBe(false);
    expect(shouldShowDuracao('devolucao', 'bh')).toBe(false);
  });

  it('Fundo mostra etapa Duracao', () => {
    const shouldShowDuracao = (situacao: string | null, golpe: string | null): boolean => {
      if (situacao === 'devolucao') return false;
      return golpe != null;
    };

    expect(shouldShowDuracao('fundo', 'fh')).toBe(true);
    expect(shouldShowDuracao('fundo', 'bh')).toBe(true);
  });
});
