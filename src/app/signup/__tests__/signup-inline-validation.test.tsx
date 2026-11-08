/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import SignupPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function getInputs() {
  return {
    name: screen.getByPlaceholderText(/Nome completo/i),
    identifier: screen.getByPlaceholderText(/E-mail ou CPF/i),
    password: screen.getByPlaceholderText(/Senha/i),
  };
}

describe('SignupPage - validação inline', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as jest.Mock;
  });

  it('valida o nome no blur sem usar o alerta global', () => {
    render(<SignupPage />);
    const { name } = getInputs();

    fireEvent.change(name, { target: { value: 'Ana' } });
    fireEvent.blur(name);

    expect(screen.getByText('Informe nome e sobrenome')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('aplica máscara de CPF e valida o dígito verificador no blur', () => {
    render(<SignupPage />);
    const { identifier } = getInputs();

    fireEvent.change(identifier, { target: { value: '529982247' } });
    expect(identifier).toHaveValue('529.982.247');
    fireEvent.blur(identifier);
    expect(screen.getByText('CPF incompleto (faltam 2 dígitos)')).toBeInTheDocument();

    fireEvent.change(identifier, { target: { value: '11111111111' } });
    fireEvent.blur(identifier);
    expect(screen.getByText('CPF inválido. Confira os dígitos digitados.')).toBeInTheDocument();

    fireEvent.change(identifier, { target: { value: '52998224725' } });
    expect(identifier).toHaveValue('529.982.247-25');
    expect(screen.getByText('CPF válido')).toBeInTheDocument();
  });

  it('não apaga letras ao digitar o e-mail antes do @', () => {
    render(<SignupPage />);
    const { identifier } = getInputs();

    fireEvent.change(identifier, { target: { value: 'ana' } });
    expect(identifier).toHaveValue('ana');
    fireEvent.blur(identifier);
    expect(screen.getByText('Informe um e-mail válido')).toBeInTheDocument();
  });

  it('mostra check verde para e-mail válido', () => {
    render(<SignupPage />);
    const { identifier } = getInputs();

    fireEvent.change(identifier, { target: { value: 'ana@rkt.com' } });

    expect(screen.getByText('E-mail válido')).toBeInTheDocument();
  });

  it('exibe a força da senha em tempo real', () => {
    render(<SignupPage />);
    const { password } = getInputs();

    fireEvent.change(password, { target: { value: 'abc' } });
    expect(screen.getByRole('status')).toHaveTextContent('Força da senha: Fraca');

    fireEvent.change(password, { target: { value: 'abcdefgh' } });
    expect(screen.getByRole('status')).toHaveTextContent('Força da senha: Média');

    fireEvent.change(password, { target: { value: 'abcdef1!' } });
    expect(screen.getByRole('status')).toHaveTextContent('Força da senha: Forte');
  });

  it('bloqueia o submit com campos inválidos sem chamar a API', () => {
    render(<SignupPage />);
    const { name, identifier, password } = getInputs();

    fireEvent.change(name, { target: { value: 'Ana' } });
    fireEvent.change(identifier, { target: { value: 'ana@' } });
    fireEvent.change(password, { target: { value: '12345678' } });
    fireEvent.click(screen.getByLabelText(/Li e aceito os/i));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByText('Informe nome e sobrenome')).toBeInTheDocument();
    expect(screen.getByText('Informe um e-mail válido')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
