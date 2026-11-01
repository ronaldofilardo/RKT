/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GestorOnboardingModal } from '../gestor-onboarding-modal';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('GestorOnboardingModal - Redirecionamento pós-cadastro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  it('redireciona para /login e fecha o modal ao concluir cadastro de clube', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Clube cadastrado com sucesso' }),
    });

    const onOpenChange = jest.fn();
    render(<GestorOnboardingModal open={true} onOpenChange={onOpenChange} />);

    // Preenche dados válidos do Passo 1
    fireEvent.change(screen.getByLabelText(/^CNPJ$/i), { target: { value: '11.222.333/0001-81' } });
    fireEvent.change(screen.getByLabelText(/Razão Social/i), { target: { value: 'CT Teste Ltda' } });
    fireEvent.change(screen.getByLabelText(/Nome Fantasia/i), { target: { value: 'CT Teste' } });
    const telInputs = screen.getAllByLabelText(/^Telefone$/i);
    fireEvent.change(telInputs[0], { target: { value: '(11) 98765-4321' } });
    fireEvent.change(screen.getByLabelText(/E-mail institucional/i), { target: { value: 'ct@teste.com' } });
    fireEvent.change(screen.getByLabelText(/Rua/i), { target: { value: 'Rua Principal' } });
    fireEvent.change(screen.getByLabelText(/Número/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Bairro/i), { target: { value: 'Centro' } });
    fireEvent.change(screen.getByLabelText(/Cidade/i), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByLabelText(/Estado/i), { target: { value: 'SP' } });
    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: '01310-100' } });
    fireEvent.change(screen.getByPlaceholderText(/Nome do representante/i), { target: { value: 'Representante Silva' } });
    fireEvent.change(screen.getByLabelText(/^CPF$/i), { target: { value: '111.444.777-35' } });
    fireEvent.change(screen.getByLabelText(/^E-mail$/i), { target: { value: 'rep@teste.com' } });
    fireEvent.change(telInputs[1], { target: { value: '(11) 98765-4321' } });

    // Avança para o Passo 2
    fireEvent.click(screen.getByRole('button', { name: /Avançar para Responsável/i }));

    // No Passo 2, marca como mesmo do representante legal
    await waitFor(() => {
      expect(screen.getByLabelText(/mesmo representante legal/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText(/mesmo representante legal/i));

    fireEvent.change(screen.getByPlaceholderText(/Mínimo 8 caracteres/i), { target: { value: 'SenhaForte123' } });
    fireEvent.change(screen.getByPlaceholderText(/Repita a senha/i), { target: { value: 'SenhaForte123' } });

    // Conclui cadastro
    fireEvent.click(screen.getByRole('button', { name: /Concluir Cadastro do Clube/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
