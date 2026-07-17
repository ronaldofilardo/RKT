/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
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
    buttons
      .filter((b) => ['Devolu\u00e7\u00e3o de Saque', 'Fundo de Quadra', 'Passada', 'Rede'].includes((b.textContent ?? '').trim()))
      .forEach((b) => {
        expect(b.getAttribute('aria-pressed')).toBe('false');
      });
  });
});
