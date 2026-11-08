/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import LoginPage from '../page';
import { loginRequest } from '@/lib/auth-client';
import { humanizeLoginError } from '../login-errors.logic';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/lib/auth-client', () => ({
  ...jest.requireActual('@/lib/auth-client'),
  loginRequest: jest.fn(),
}));

describe('humanizeLoginError', () => {
  it('traduz USER_NOT_FOUND', () => {
    expect(humanizeLoginError({ code: 'USER_NOT_FOUND' })).toBe(
      'Não encontramos uma conta com este e-mail ou CPF.',
    );
  });

  it('traduz INVALID_PASSWORD', () => {
    expect(humanizeLoginError({ code: 'INVALID_PASSWORD' })).toBe(
      'Senha incorreta. Verifique os dados digitados.',
    );
  });

  it('traduz falha de rede e erro 5xx para indisponibilidade', () => {
    const offline = 'Serviço temporariamente indisponível. Verifique sua conexão.';
    expect(humanizeLoginError(new TypeError('Failed to fetch'))).toBe(offline);
    expect(humanizeLoginError({ status: 500 })).toBe(offline);
  });

  it('mantém a mensagem recebida quando não há código conhecido', () => {
    expect(humanizeLoginError(new Error('Conta bloqueada'))).toBe('Conta bloqueada');
  });
});

describe('LoginPage - senha provisória', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exibe o banner por 1,5s antes de redirecionar para /trocar-senha', async () => {
    (loginRequest as jest.Mock).mockResolvedValueOnce({
      user: { id: 'u-1', name: 'Ana', role: 'ATLETA', mustChangePassword: true },
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/E-mail ou CPF/i), { target: { value: 'ana@rkt.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'provisoria1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await act(async () => {});

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sua senha é provisória. Redirecionando para definir uma senha definitiva...',
    );
    expect(screen.getByRole('button', { name: 'Redirecionando...' })).toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockPush).toHaveBeenCalledWith('/trocar-senha');
  });
});
