/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '../page';

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

describe('SignupPage - Fluxo de redirecionamento pós-cadastro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
    mockSearchParams.delete('perfil');
    mockSearchParams.delete('origem');
  });

  function fillFormAndSubmit() {
    fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), { target: { value: 'Atleta Teste' } });
    fireEvent.change(screen.getByPlaceholderText(/E-mail ou CPF/i), { target: { value: 'atleta@teste.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Senha/i), { target: { value: 'senhaForte123' } });
    fireEvent.click(screen.getByLabelText(/Li e aceito os/i));
  }

  it('redireciona para /login após criação de conta bem-sucedida', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Conta criada com sucesso' }),
    });

    render(<SignupPage />);

    fillFormAndSubmit();
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('exibe erro caso a API de cadastro retorne falha', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'E-mail já cadastrado' }),
    });

    render(<SignupPage />);

    fillFormAndSubmit();
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText('E-mail já cadastrado')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('exige aceite dos termos antes de cadastrar', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Conta criada com sucesso' }),
    });

    render(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), { target: { value: 'Atleta Teste' } });
    fireEvent.change(screen.getByPlaceholderText(/E-mail ou CPF/i), { target: { value: 'atleta@teste.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Senha/i), { target: { value: 'senhaForte123' } });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/É necessário aceitar os Termos de Uso e Política de Privacidade/)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('abre o modal ao selecionar o perfil GESTOR', async () => {
    render(<SignupPage />);

    fillFormAndSubmit();
    fireEvent.change(screen.getByLabelText(/Perfil principal/i), { target: { value: 'GESTOR' } });

    const btn = screen.getByRole('button', { name: /Avançar para Cadastro de Clube/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
