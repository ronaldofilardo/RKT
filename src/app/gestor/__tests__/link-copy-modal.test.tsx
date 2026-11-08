/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LinkCopyModal } from '../link-copy-modal';
import { buildResetLink, formatLinkExpiry } from '../link-copy-modal.logic';

describe('link-copy-modal.logic', () => {
  it('monta o link de redefinição com o token', () => {
    expect(buildResetLink('https://rkt.app', 'abc')).toBe('https://rkt.app/trocar-senha?token=abc');
  });

  it('exibe o prazo explícito com data e hora', () => {
    expect(formatLinkExpiry('2026-11-08T14:30:00')).toBe(
      'Este link expira em 7 dias (válido até 08/11/2026 às 14:30)',
    );
  });

  it('usa o prazo padrão quando expiresAt não é informado ou é inválido', () => {
    expect(formatLinkExpiry()).toBe('Este link expira em 7 dias.');
    expect(formatLinkExpiry('data-invalida')).toBe('Este link expira em 7 dias.');
  });
});

describe('LinkCopyModal', () => {
  const writeText = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    writeText.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderModal = (expiresAt = '2026-11-08T14:30:00') =>
    render(
      <LinkCopyModal
        open
        onOpenChange={jest.fn()}
        title="Link de Redefinição de Senha"
        recipientName="Ana"
        token="tok-1"
        expiresAt={expiresAt}
      />,
    );

  it('mostra o link e o prazo explícito de expiração', () => {
    renderModal();

    expect(screen.getByText(/trocar-senha\?token=tok-1/)).toBeInTheDocument();
    expect(
      screen.getByText('Este link expira em 7 dias (válido até 08/11/2026 às 14:30)'),
    ).toBeInTheDocument();
  });

  it('copia o link e troca ícone/texto por 2 segundos', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));

    await act(async () => {});

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/trocar-senha?token=tok-1'));
    expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiado!' }).querySelector('svg')).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
  });
});
