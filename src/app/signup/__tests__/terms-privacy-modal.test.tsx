/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SignupPage from '../page';
import { TermsPrivacyModal } from '../terms-privacy-modal';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function scrollToEnd(container: HTMLElement) {
  Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: 300, writable: true, configurable: true });
  Object.defineProperty(container, 'scrollTop', { value: 690, writable: true, configurable: true });
  fireEvent.scroll(container);
}

describe('TermsPrivacyModal - Ambos documentos obrigatorios e instrucao', () => {
  it('abre o modal ao clicar no label dos termos quando ainda nao aceito', () => {
    render(<SignupPage />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    fireEvent.click(screen.getByText(/Li e aceito os/i));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('mantem Concordo desabilitado ate que ambos os documentos sejam rolados ate o fim', () => {
    const handleAccept = jest.fn();
    render(<TermsPrivacyModal open={true} initialTab="TERMOS" onClose={jest.fn()} onAccept={handleAccept} />);

    const concordoBtn = screen.getByRole('button', { name: /Concordo/i });
    expect(concordoBtn).toBeDisabled();
    expect(screen.getByTestId('terms-modal-instruction')).toHaveTextContent(/Role ambos os documentos/i);

    const scrollContainer = screen.getByTestId('terms-modal-scroll');
    scrollToEnd(scrollContainer);
    expect(concordoBtn).toBeDisabled();
    expect(screen.getByTestId('terms-modal-instruction')).toHaveTextContent(/Termos lidos! Abra a aba Política de Privacidade/i);

    fireEvent.click(screen.getByRole('button', { name: /Política de Privacidade/i }));
    expect(concordoBtn).toBeDisabled();

    scrollToEnd(scrollContainer);
    expect(concordoBtn).toBeEnabled();
    expect(screen.getByTestId('terms-modal-instruction')).toHaveTextContent(/Ambos os documentos lidos/i);

    fireEvent.click(concordoBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);
  });

  it('marca a checkbox de termos somente apos concluir o fluxo do modal', () => {
    render(<SignupPage />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(screen.getByRole('link', { name: /Termos de Uso/i }));
    const scrollContainer = screen.getByTestId('terms-modal-scroll');
    scrollToEnd(scrollContainer);
    fireEvent.click(screen.getByRole('button', { name: /Política de Privacidade/i }));
    scrollToEnd(scrollContainer);

    const concordoBtn = screen.getByRole('button', { name: /Concordo/i });
    expect(concordoBtn).toBeEnabled();
    fireEvent.click(concordoBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(checkbox.checked).toBe(true);
    expect(checkbox).not.toBeDisabled();
  });

  it('fecha o modal pelo Cancelar mantendo o checkbox desabilitado e desmarcado', () => {
    render(<SignupPage />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    fireEvent.click(screen.getByRole('link', { name: /Termos de Uso/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
    expect(checkbox).toBeDisabled();
  });
});
