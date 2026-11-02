/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { TrocarSenhaSuccess, TrocarSenhaForm } from '../components';

describe('TrocarSenhaSuccess', () => {
  it('exibe mensagem de sucesso e dispara onLoginClick ao clicar no botão', () => {
    const mockOnLoginClick = jest.fn();
    render(<TrocarSenhaSuccess onLoginClick={mockOnLoginClick} />);

    expect(screen.getByText('Senha alterada com sucesso!')).toBeInTheDocument();
    expect(screen.getByText('Você já pode acessar a plataforma com sua nova senha.')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /ir para o login/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockOnLoginClick).toHaveBeenCalledTimes(1);
  });
});

describe('TrocarSenhaForm - Escape Hatch', () => {
  const defaultProps = {
    currentPassword: '',
    setCurrentPassword: jest.fn(),
    newPassword: '',
    setNewPassword: jest.fn(),
    confirmPassword: '',
    setConfirmPassword: jest.fn(),
    error: null,
    loading: false,
    onSubmit: jest.fn(),
  };

  it('permite cancelar e sair para o login via rodapé', () => {
    const mockOnCancel = jest.fn();
    render(<TrocarSenhaForm {...defaultProps} onCancel={mockOnCancel} />);

    const exitBtn = screen.getByRole('button', { name: /sair e fazer login/i });
    expect(exitBtn).toBeInTheDocument();
    fireEvent.click(exitBtn);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('permite sair quando erro é exibido', () => {
    const mockOnCancel = jest.fn();
    render(<TrocarSenhaForm {...defaultProps} error="Senha provisória expirada" onCancel={mockOnCancel} />);

    expect(screen.getByText('Senha provisória expirada')).toBeInTheDocument();
    const alertExitBtn = screen.getByRole('button', { name: /sair desta conta e voltar ao login/i });
    expect(alertExitBtn).toBeInTheDocument();
    fireEvent.click(alertExitBtn);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
