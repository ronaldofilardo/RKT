/**
 * @jest-environment jsdom
 */
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrocarSenhaForm } from '../components';

function Harness() {
  const [newPassword, setNewPassword] = useState('Senha123!');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <TrocarSenhaForm
      currentPassword=""
      setCurrentPassword={jest.fn()}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      error={null}
      loading={false}
      hasToken
      onSubmit={jest.fn()}
    />
  );
}

describe('TrocarSenhaForm - confirmação em tempo real', () => {
  it('mostra "As senhas não coincidem" ao digitar, sem clicar em Salvar', () => {
    render(<Harness />);
    const confirm = screen.getByPlaceholderText('Confirmar nova senha');

    fireEvent.change(confirm, { target: { value: 'Outra123!' } });
    expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();

    fireEvent.change(confirm, { target: { value: 'Senha123!' } });
    expect(screen.queryByText('As senhas não coincidem')).not.toBeInTheDocument();
  });
});
