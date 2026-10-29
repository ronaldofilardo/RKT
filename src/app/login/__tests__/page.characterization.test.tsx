/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';
import { loginRequest } from '@/lib/auth-client';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/auth-client', () => ({
  ...jest.requireActual('@/lib/auth-client'),
  loginRequest: jest.fn(),
}));

describe('LoginPage Characterization', () => {
  it('renderiza o formulário de login com campos de email e senha', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { level: 1, name: /RKT Tennis/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail ou CPF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('alterna visibilidade da senha ao clicar no olhinho', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/Senha/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /Visualizar/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    const hideBtn = screen.getByRole('button', { name: /Ocultar/i });
    fireEvent.click(hideBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('informa erro específico quando o usuário não é encontrado ou senha está errada', async () => {
    const errorWithCode = new Error('Usuário não encontrado. Verifique o e-mail ou CPF digitado.');
    (errorWithCode as any).code = 'USER_NOT_FOUND';
    (loginRequest as jest.Mock).mockRejectedValueOnce(errorWithCode);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/E-mail ou CPF/i), { target: { value: 'inexistente@rkt.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Usuário não encontrado/i);
    });
  });
});
