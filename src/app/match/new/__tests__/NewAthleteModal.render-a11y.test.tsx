/**
 * @jest-environment jsdom
 */
// Divisão de NewAthleteModal.characterization.test.tsx (381L) — render/a11y.
// Kit compartilhado: newAthleteModalTestKit.tsx.
import { screen } from '@testing-library/react';
import { installFetchMock, seedSessionStorage, setupModal } from './newAthleteModalTestKit';

const mockFetch = installFetchMock();

describe('NewAthleteModal — render inicial e acessibilidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    seedSessionStorage();
  });

  it('renders nothing when isOpen is false', () => {
    const { queryByText } = setupModal({ isOpen: false });
    expect(queryByText('Novo Atleta')).not.toBeInTheDocument();
  });

  it('renders modal with title when isOpen is true', () => {
    setupModal();
    expect(screen.getByText('Novo Atleta')).toBeInTheDocument();
    expect(screen.getByText('Preencha os dados do jogador')).toBeInTheDocument();
  });

  it('shows Cancel and Save buttons', () => {
    setupModal();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar Atleta' })).toBeInTheDocument();
  });

  it('separa os campos em Cadastro e Ranking', () => {
    setupModal();
    expect(screen.getByRole('heading', { name: '1. Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2. Ranking' })).toBeInTheDocument();
  });

  it('has proper labels for all inputs', () => {
    setupModal();
    expect(screen.getByPlaceholderText('Ex: João Silva')).toBeInTheDocument();
    expect(screen.getByLabelText('Sexo')).toBeInTheDocument();
    expect(screen.getByLabelText('Dia')).toBeInTheDocument();
    expect(screen.getByLabelText('Mês')).toBeInTheDocument();
    expect(screen.getByLabelText('Ano')).toBeInTheDocument();
    expect(screen.getByLabelText('Dominância')).toBeInTheDocument();
    expect(screen.getByLabelText('Backhand')).toBeInTheDocument();
  });

  it('modal has proper role attributes', () => {
    setupModal();
    expect(screen.getByLabelText('Fechar modal')).toHaveAttribute('role', 'button');
  });
});
